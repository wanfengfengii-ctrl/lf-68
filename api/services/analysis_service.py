from datetime import datetime, timedelta
from api.models import db, AshWaterBatch, PhRecord
from api.config import Config


def analyze_ph_trend(ph_records):
    if not ph_records or len(ph_records) < 2:
        return {
            'trend': 'stable',
            'changeRate': 0.0,
            'totalChange': 0.0,
            'volatility': 0.0,
            'avgPh': None,
            'windowSize': 0,
        }

    window_size = min(len(ph_records), Config.WARNING_CONFIG['ph_trend_window'])
    recent_records = ph_records[-window_size:]

    first_ph = recent_records[0].ph_value
    last_ph = recent_records[-1].ph_value
    total_change = last_ph - first_ph

    first_time = recent_records[0].measured_at
    last_time = recent_records[-1].measured_at
    hours_diff = max((last_time - first_time).total_seconds() / 3600, 0.01)

    change_rate = total_change / hours_diff

    stable_threshold = Config.WARNING_CONFIG['ph_stable_threshold']
    if abs(total_change) < stable_threshold:
        trend = 'stable'
    elif total_change > 0:
        trend = 'rising'
    else:
        trend = 'falling'

    ph_values = [r.ph_value for r in recent_records]
    avg_ph = sum(ph_values) / len(ph_values)
    variance = sum((v - avg_ph) ** 2 for v in ph_values) / len(ph_values)
    volatility = variance ** 0.5

    return {
        'trend': trend,
        'changeRate': change_rate,
        'totalChange': total_change,
        'volatility': volatility,
        'avgPh': avg_ph,
        'windowSize': window_size,
    }


def detect_warnings(batch, ph_records, trend_analysis, filter_records=None, usage_records=None):
    warnings = []
    warning_level = None
    now = datetime.now()

    current_ph = batch.current_ph
    filter_records = filter_records or []
    usage_records = usage_records or []

    if current_ph is not None:
        is_normal = Config.APPLICABLE_PH_MIN <= current_ph <= Config.APPLICABLE_PH_MAX

        if not is_normal:
            consecutive_count = 0
            for record in reversed(ph_records):
                ph_in_range = Config.APPLICABLE_PH_MIN <= record.ph_value <= Config.APPLICABLE_PH_MAX
                if not ph_in_range:
                    consecutive_count += 1
                else:
                    break

            threshold = Config.WARNING_CONFIG['consecutive_abnormal_threshold']
            if consecutive_count >= threshold:
                warnings.append({
                    'type': 'consecutive_abnormal',
                    'typeName': Config.WARNING_TYPES['consecutive_abnormal'],
                    'message': f'PH值已连续{consecutive_count}次异常，当前值为{current_ph:.1f}',
                    'count': consecutive_count,
                    'level': 'high',
                    'timestamp': now.isoformat(),
                    'advice': '建议立即停止使用该批次灰水，重新检测PH值或进行过滤处理',
                })
                warning_level = 'high'
            elif consecutive_count > 0:
                warnings.append({
                    'type': 'consecutive_abnormal',
                    'typeName': Config.WARNING_TYPES['consecutive_abnormal'],
                    'message': f'PH值异常，已连续{consecutive_count}次偏离正常范围',
                    'count': consecutive_count,
                    'level': 'medium',
                    'timestamp': now.isoformat(),
                    'advice': '建议密切监测PH变化，如果持续异常应限制使用',
                })
                if warning_level != 'high':
                    warning_level = 'medium'
        else:
            consecutive_count = 0

        rapid_threshold = Config.WARNING_CONFIG['ph_rapid_change_threshold']
        rapid_hours = Config.WARNING_CONFIG['ph_rapid_change_hours']

        if len(ph_records) >= 2:
            recent_hours_records = [
                r for r in ph_records
                if (now - r.measured_at).total_seconds() / 3600 <= rapid_hours
            ]
            if len(recent_hours_records) >= 2:
                ph_change = recent_hours_records[-1].ph_value - recent_hours_records[0].ph_value
                if abs(ph_change) >= rapid_threshold:
                    if ph_change > 0:
                        warnings.append({
                            'type': 'ph_rising_rapidly',
                            'typeName': Config.WARNING_TYPES['ph_rising_rapidly'],
                            'message': f'PH值在{rapid_hours}小时内快速上升{ph_change:.1f}，需关注',
                            'change': ph_change,
                            'level': 'medium',
                            'timestamp': now.isoformat(),
                            'advice': 'PH快速上升可能影响染色效果，建议加强监测频率',
                        })
                    else:
                        warnings.append({
                            'type': 'ph_falling_rapidly',
                            'typeName': Config.WARNING_TYPES['ph_falling_rapidly'],
                            'message': f'PH值在{rapid_hours}小时内快速下降{abs(ph_change):.1f}，需关注',
                            'change': ph_change,
                            'level': 'medium',
                            'timestamp': now.isoformat(),
                            'advice': 'PH快速下降可能影响染色效果，建议加强监测频率',
                        })
                    if warning_level != 'high':
                        warning_level = 'medium'

    if batch.last_ph_check_time:
        hours_since_check = (now - batch.last_ph_check_time).total_seconds() / 3600
        max_hours = Config.WARNING_CONFIG['max_hours_since_last_ph']
        if hours_since_check > max_hours:
            days_overdue = int(hours_since_check / 24)
            warnings.append({
                'type': 'long_time_no_check',
                'typeName': Config.WARNING_TYPES['long_time_no_check'],
                'message': f'已超过{days_overdue}天未进行PH检测，请及时检测',
                'hoursSinceCheck': hours_since_check,
                'level': 'low',
                'timestamp': now.isoformat(),
                'advice': '请及时进行PH值检测以确保灰水质量',
            })
            if warning_level is None:
                warning_level = 'low'
    else:
        if batch.current_ph is None:
            hours_since_created = (now - batch.created_at).total_seconds() / 3600
            if hours_since_created > 24:
                warnings.append({
                    'type': 'long_time_no_check',
                    'typeName': Config.WARNING_TYPES['long_time_no_check'],
                    'message': '批次创建超过24小时仍未进行PH检测',
                    'hoursSinceCheck': hours_since_created,
                    'level': 'medium',
                    'timestamp': now.isoformat(),
                    'advice': '请尽快进行首次PH值检测',
                })
                warning_level = 'medium'

    excessive_filter_threshold = Config.WARNING_CONFIG['excessive_filter_count']
    if batch.filter_count >= excessive_filter_threshold:
        warnings.append({
            'type': 'excessive_filtering',
            'typeName': Config.WARNING_TYPES['excessive_filtering'],
            'message': f'已进行{batch.filter_count}次过滤，超过建议阈值{excessive_filter_threshold}次',
            'count': batch.filter_count,
            'level': 'medium',
            'timestamp': now.isoformat(),
            'advice': '过滤次数过多可能导致有效成分流失，建议评估是否需要重新制备灰水',
        })
        if warning_level != 'high':
            warning_level = 'medium'

    total_used = sum(ur.volume_used for ur in usage_records)
    remaining = batch.water_volume - total_used
    remaining_percent = (remaining / batch.water_volume) * 100 if batch.water_volume > 0 else 0

    very_low_threshold = Config.WARNING_CONFIG['very_low_remaining_volume_percent']
    low_threshold = Config.WARNING_CONFIG['low_remaining_volume_percent']

    if remaining_percent <= very_low_threshold:
        warnings.append({
            'type': 'low_remaining_volume',
            'typeName': Config.WARNING_TYPES['low_remaining_volume'],
            'message': f'剩余量仅剩{remaining:.1f}L（{remaining_percent:.1f}%），即将用尽',
            'level': 'high',
            'timestamp': now.isoformat(),
            'advice': '剩余量严重不足，建议尽快制备新批次灰水',
        })
        warning_level = 'high'
    elif remaining_percent <= low_threshold:
        warnings.append({
            'type': 'low_remaining_volume',
            'typeName': Config.WARNING_TYPES['low_remaining_volume'],
            'message': f'剩余量不足{remaining:.1f}L（{remaining_percent:.1f}%）',
            'level': 'medium',
            'timestamp': now.isoformat(),
            'advice': '剩余量较低，建议提前准备新批次灰水',
        })
        if warning_level != 'high':
            warning_level = 'medium'

    usage_days = Config.WARNING_CONFIG['high_usage_frequency_days']
    usage_count_threshold = Config.WARNING_CONFIG['high_usage_frequency_count']
    recent_usage = [
        ur for ur in usage_records
        if (now - ur.usage_date).total_seconds() / 86400 <= usage_days
    ]
    if len(recent_usage) >= usage_count_threshold:
        warnings.append({
            'type': 'high_usage_frequency',
            'typeName': Config.WARNING_TYPES['high_usage_frequency'],
            'message': f'近{usage_days}天已使用{len(recent_usage)}次，使用频率较高',
            'count': len(recent_usage),
            'level': 'low',
            'timestamp': now.isoformat(),
            'advice': '使用频率较高，建议关注PH值变化，必要时增加检测频率',
        })
        if warning_level is None:
            warning_level = 'low'

    batch_age_days = (now - batch.created_at).total_seconds() / 86400
    max_age_days = Config.WARNING_CONFIG['max_batch_age_days']
    if batch_age_days >= max_age_days:
        warnings.append({
            'type': 'batch_expiring',
            'typeName': Config.WARNING_TYPES['batch_expiring'],
            'message': f'批次已使用{int(batch_age_days)}天，超过建议使用周期{max_age_days}天',
            'level': 'medium',
            'timestamp': now.isoformat(),
            'advice': '批次使用时间过长，建议进行复检确认质量，或考虑制备新批次',
        })
        if warning_level != 'high':
            warning_level = 'medium'

    if current_ph is not None and is_normal:
        days_since_check = (now - batch.last_ph_check_time).total_seconds() / 86400 if batch.last_ph_check_time else 0
        if len(usage_records) >= 3 and days_since_check >= 3:
            warnings.append({
                'type': 'needs_recheck',
                'typeName': Config.WARNING_TYPES['needs_recheck'],
                'message': '近期使用频繁且已超过3天未检测，建议进行复检',
                'level': 'low',
                'timestamp': now.isoformat(),
                'advice': '使用频繁的批次建议每3天检测一次PH值，确保质量稳定',
            })
            if warning_level is None:
                warning_level = 'low'

    has_high_warning = any(w['type'] == 'consecutive_abnormal' and w.get('count', 0) >= Config.WARNING_CONFIG['consecutive_abnormal_threshold'] for w in warnings)
    has_very_low_volume = any(w['type'] == 'low_remaining_volume' and w['level'] == 'high' for w in warnings)
    if has_high_warning or has_very_low_volume:
        warnings.append({
            'type': 'usage_restricted',
            'typeName': Config.WARNING_TYPES['usage_restricted'],
            'message': '因质量异常或剩余量不足，该批次已被限制使用',
            'level': 'high',
            'timestamp': now.isoformat(),
            'advice': '请处理异常后重新检测，待指标恢复正常后方可使用',
        })

    if not warnings:
        warning_level = None

    return {
        'hasWarning': len(warnings) > 0,
        'warningTypes': [w['type'] for w in warnings],
        'warningLevel': warning_level,
        'list': warnings,
        'warnings': warnings,
        'usageRestricted': has_high_warning or has_very_low_volume,
    }


def recommend_processes(batch, ph_records, trend_analysis, filter_records):
    current_ph = batch.current_ph

    if current_ph is None:
        return {
            'recommended': [],
            'notRecommended': [],
            'requiresAttention': ['尚未检测PH值，无法推荐工序'],
            'overallScore': 0,
        }

    process_scores = {}
    process_details = []

    for process, (min_ph, max_ph) in Config.PROCESS_PH_RANGES.items():
        mid_ph = (min_ph + max_ph) / 2
        range_width = max_ph - min_ph

        distance_from_mid = abs(current_ph - mid_ph)
        in_range = min_ph <= current_ph <= max_ph

        if in_range:
            base_score = 100 - (distance_from_mid / (range_width / 2)) * 30
        else:
            if current_ph < min_ph:
                distance = min_ph - current_ph
            else:
                distance = current_ph - max_ph
            base_score = max(0, 50 - distance * 20)

        trend_penalty = 0
        if trend_analysis['trend'] == 'rising' and current_ph >= max_ph - 0.5:
            trend_penalty = 15
        elif trend_analysis['trend'] == 'falling' and current_ph <= min_ph + 0.5:
            trend_penalty = 15
        elif trend_analysis['trend'] != 'stable':
            trend_penalty = 5

        volatility_penalty = min(trend_analysis['volatility'] * 10, 20)

        filter_bonus = min(batch.filter_count * 3, 15)

        final_score = base_score - trend_penalty - volatility_penalty + filter_bonus
        final_score = max(0, min(100, final_score))

        process_scores[process] = final_score

        process_details.append({
            'process': process,
            'processName': Config.PROCESS_NAMES[process],
            'minPh': min_ph,
            'maxPh': max_ph,
            'score': round(final_score, 1),
            'isRecommended': final_score >= 60,
            'inRange': in_range,
            'reasons': _generate_reasons(
                process, current_ph, min_ph, max_ph, in_range,
                trend_analysis, batch.filter_count, volatility_penalty
            ),
        })

    sorted_processes = sorted(process_details, key=lambda x: x['score'], reverse=True)
    recommended = [p for p in sorted_processes if p['isRecommended']]
    not_recommended = [p for p in sorted_processes if not p['isRecommended']]

    requires_attention = []
    if batch.has_warning:
        requires_attention.append('该批次存在预警，请先处理预警事项')
    if batch.usage_restricted:
        requires_attention.append('该批次已被限制使用')
    if trend_analysis['volatility'] > 1.0:
        requires_attention.append(f'PH值波动较大（标准差{trend_analysis["volatility"]:.2f}），建议加强监测')
    if trend_analysis['trend'] == 'rising' and trend_analysis['changeRate'] > 0.05:
        requires_attention.append('PH值呈上升趋势，使用时需关注碱度变化')
    if trend_analysis['trend'] == 'falling' and trend_analysis['changeRate'] < -0.05:
        requires_attention.append('PH值呈下降趋势，使用时需关注碱度变化')

    overall_score = round(sum(process_scores.values()) / len(process_scores), 1) if process_scores else 0

    return {
        'recommended': recommended,
        'notRecommended': not_recommended,
        'requiresAttention': requires_attention,
        'overallScore': overall_score,
        'trendAnalysis': {
            'trend': trend_analysis['trend'],
            'trendName': {
                'rising': '上升',
                'falling': '下降',
                'stable': '稳定',
            }.get(trend_analysis['trend'], '稳定'),
            'changeRate': round(trend_analysis['changeRate'], 4),
            'totalChange': round(trend_analysis['totalChange'], 2),
            'volatility': round(trend_analysis['volatility'], 2),
            'avgPh': round(trend_analysis['avgPh'], 2) if trend_analysis['avgPh'] else None,
        },
    }


def _generate_reasons(process, current_ph, min_ph, max_ph, in_range, trend_analysis, filter_count, volatility_penalty):
    reasons = []

    if in_range:
        mid_ph = (min_ph + max_ph) / 2
        if abs(current_ph - mid_ph) < 0.5:
            reasons.append('PH值处于最佳范围')
        else:
            reasons.append('PH值在适用范围内')
    else:
        if current_ph < min_ph:
            reasons.append(f'PH值偏低（低于最低要求{min_ph - current_ph:.1f}）')
        else:
            reasons.append(f'PH值偏高（高于最高要求{current_ph - max_ph:.1f}）')

    if trend_analysis['trend'] == 'rising':
        reasons.append('PH呈上升趋势')
    elif trend_analysis['trend'] == 'falling':
        reasons.append('PH呈下降趋势')
    else:
        reasons.append('PH保持稳定')

    if filter_count > 0:
        reasons.append(f'已进行{filter_count}次过滤')

    if volatility_penalty > 5:
        reasons.append('近期PH波动较大')

    return reasons


def run_full_analysis(batch_id):
    from api.services.batch_service import get_batch_by_id
    from api.models import UsageRecord, FilterRecord

    batch = get_batch_by_id(batch_id)

    ph_records = PhRecord.query.filter_by(batch_id=batch_id).order_by(PhRecord.measured_at.asc()).all()
    filter_records = FilterRecord.query.filter_by(batch_id=batch_id).order_by(FilterRecord.filter_date.asc()).all()
    usage_records = UsageRecord.query.filter_by(batch_id=batch_id).order_by(UsageRecord.usage_date.asc()).all()

    if ph_records:
        batch.last_ph_check_time = ph_records[-1].measured_at

    trend_analysis = analyze_ph_trend(ph_records)
    batch.ph_trend = trend_analysis['trend']
    batch.ph_change_rate = trend_analysis['changeRate']

    warning_result = detect_warnings(batch, ph_records, trend_analysis, filter_records, usage_records)
    batch.has_warning = warning_result['hasWarning']
    batch.warning_types = warning_result['warningTypes']
    batch.warning_level = warning_result['warningLevel']
    batch.usage_restricted = warning_result['usageRestricted']

    if warning_result['hasWarning']:
        batch.last_warning_time = datetime.now()

    consecutive_count = 0
    for record in reversed(ph_records):
        ph_in_range = Config.APPLICABLE_PH_MIN <= record.ph_value <= Config.APPLICABLE_PH_MAX
        if not ph_in_range:
            consecutive_count += 1
        else:
            break
    batch.consecutive_abnormal_count = consecutive_count

    from api.services.batch_service import determine_status
    batch.status = determine_status(batch)

    recommendation = recommend_processes(batch, ph_records, trend_analysis, filter_records)

    db.session.commit()

    return {
        'batch': batch.to_dict(),
        'trendAnalysis': trend_analysis,
        'warnings': warning_result,
        'recommendations': recommendation,
    }


def get_all_warnings():
    from api.services.batch_service import get_all_batches

    all_batches = AshWaterBatch.query.filter(
        AshWaterBatch.has_warning == True
    ).order_by(AshWaterBatch.updated_at.desc()).all()

    warning_stats = {
        'total': 0,
        'high': 0,
        'medium': 0,
        'low': 0,
        'restricted': 0,
        'byType': {},
    }

    warning_batches = []
    for batch in all_batches:
        warning_stats['total'] += 1
        if batch.warning_level:
            warning_stats[batch.warning_level] = warning_stats.get(batch.warning_level, 0) + 1
        if batch.usage_restricted:
            warning_stats['restricted'] += 1

        for wt in batch.warning_types:
            warning_stats['byType'][wt] = warning_stats['byType'].get(wt, 0) + 1

        warning_batches.append({
            'batch': batch.to_dict(),
        })

    return {
        'stats': warning_stats,
        'batches': warning_batches,
    }


def recommend_batches_for_process(process=None, fabric_type=None, min_volume=0):
    from api.models import PhRecord, FilterRecord, UsageRecord

    now = datetime.now()

    query = AshWaterBatch.query.filter(
        AshWaterBatch.status != 'exhausted',
        AshWaterBatch.usage_restricted == False,
        AshWaterBatch.current_ph.isnot(None)
    )

    all_batches = query.order_by(AshWaterBatch.updated_at.desc()).all()

    results = []
    for batch in all_batches:
        total_used = sum(ur.volume_used for ur in batch.usage_records)
        remaining = batch.water_volume - total_used

        if remaining < min_volume:
            continue

        ph_records = PhRecord.query.filter_by(batch_id=batch.id).order_by(PhRecord.measured_at.asc()).all()
        filter_records = FilterRecord.query.filter_by(batch_id=batch.id).order_by(FilterRecord.filter_date.asc()).all()
        usage_records = batch.usage_records

        trend_analysis = analyze_ph_trend(ph_records)
        warning_result = detect_warnings(batch, ph_records, trend_analysis, filter_records, usage_records)

        if warning_result['usageRestricted']:
            continue

        recommendation = recommend_processes(batch, ph_records, trend_analysis, filter_records)

        process_scores = {}
        for rec in recommendation['recommended'] + recommendation['notRecommended']:
            process_scores[rec['process']] = {
                'score': rec['score'],
                'inRange': rec['inRange'],
                'reasons': rec['reasons'],
                'minPh': rec['minPh'],
                'maxPh': rec['maxPh'],
                'processName': rec['processName'],
            }

        overall_score = recommendation['overallScore']

        batch_age_days = (now - batch.created_at).total_seconds() / 86400
        age_penalty = min(batch_age_days / 60, 0.3) * 100

        remaining_percent = (remaining / batch.water_volume) * 100
        volume_bonus = min(remaining_percent / 100, 0.2) * 100

        filter_bonus = min(batch.filter_count * 2, 10)

        warning_penalty = 0
        if warning_result['hasWarning']:
            if warning_result['warningLevel'] == 'high':
                warning_penalty = 50
            elif warning_result['warningLevel'] == 'medium':
                warning_penalty = 20
            else:
                warning_penalty = 10

        final_score = overall_score - age_penalty + volume_bonus + filter_bonus - warning_penalty
        final_score = max(0, min(100, final_score))

        batch_data = batch.to_dict()

        process_recommendation = None
        if process and process in process_scores:
            process_recommendation = process_scores[process]
            final_score = process_scores[process]['score'] - age_penalty + volume_bonus + filter_bonus - warning_penalty
            final_score = max(0, min(100, final_score))

        results.append({
            'batch': batch_data,
            'remainingVolume': remaining,
            'remainingPercent': remaining_percent,
            'totalUsed': total_used,
            'usageCount': len(usage_records),
            'ageDays': batch_age_days,
            'overallScore': round(overall_score, 1),
            'finalScore': round(final_score, 1),
            'processScores': process_scores,
            'processRecommendation': process_recommendation,
            'trendAnalysis': recommendation.get('trendAnalysis'),
            'warnings': warning_result,
            'recommendations': recommendation,
            'isRecommended': final_score >= 60,
        })

    results.sort(key=lambda x: x['finalScore'], reverse=True)

    recommended = [r for r in results if r['isRecommended']]
    not_recommended = [r for r in results if not r['isRecommended']]

    process_advice = []
    if process:
        process_name = Config.PROCESS_NAMES.get(process, process)
        ph_range = Config.PROCESS_PH_RANGES.get(process)

        if not recommended:
            process_advice.append(f'当前没有适合{process_name}工序的批次，建议：')
            process_advice.append(f'1. 检查现有批次PH值是否在{ph_range[0]}-{ph_range[1]}范围内')
            process_advice.append('2. 考虑制备新批次灰水')
            process_advice.append('3. 对现有批次进行过滤处理以调整碱度')
        else:
            best = recommended[0]
            process_advice.append(f'推荐使用批次 {best["batch"]["batchNumber"]} 进行{process_name}')
            if best['processRecommendation']:
                if best['processRecommendation']['inRange']:
                    process_advice.append(f'✓ 当前PH值 {best["batch"]["currentPh"]:.1f} 在适用范围内')
                else:
                    process_advice.append(f'⚠ 当前PH值 {best["batch"]["currentPh"]:.1f} 略偏离最佳范围')

    return {
        'process': process,
        'processName': Config.PROCESS_NAMES.get(process, process) if process else None,
        'fabricType': fabric_type,
        'targetPhRange': Config.PROCESS_PH_RANGES.get(process) if process else None,
        'recommended': recommended,
        'notRecommended': not_recommended,
        'totalAvailable': len(results),
        'totalRecommended': len(recommended),
        'advice': process_advice,
        'generatedAt': now.isoformat(),
    }
