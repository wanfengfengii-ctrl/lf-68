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


def detect_warnings(batch, ph_records, trend_analysis):
    warnings = []
    warning_level = None
    now = datetime.now()

    current_ph = batch.current_ph

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

    has_high_warning = any(w['type'] == 'consecutive_abnormal' and w.get('count', 0) >= Config.WARNING_CONFIG['consecutive_abnormal_threshold'] for w in warnings)
    if has_high_warning:
        warnings.append({
            'type': 'usage_restricted',
            'typeName': Config.WARNING_TYPES['usage_restricted'],
            'message': '因PH连续异常，该批次已被限制使用，请处理后再使用',
            'level': 'high',
            'timestamp': now.isoformat(),
            'advice': '请处理PH异常后重新检测，待指标恢复正常后方可使用',
        })

    if not warnings:
        warning_level = None

    return {
        'hasWarning': len(warnings) > 0,
        'warningTypes': [w['type'] for w in warnings],
        'warningLevel': warning_level,
        'list': warnings,
        'warnings': warnings,
        'usageRestricted': has_high_warning,
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

    batch = get_batch_by_id(batch_id)

    ph_records = PhRecord.query.filter_by(batch_id=batch_id).order_by(PhRecord.measured_at.asc()).all()

    if ph_records:
        batch.last_ph_check_time = ph_records[-1].measured_at

    trend_analysis = analyze_ph_trend(ph_records)
    batch.ph_trend = trend_analysis['trend']
    batch.ph_change_rate = trend_analysis['changeRate']

    warning_result = detect_warnings(batch, ph_records, trend_analysis)
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

    filter_records = batch.filter_records
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


def get_batch_recommendation(process=None, fabric_type=None, min_volume=0):
    from api.services.batch_service import get_all_batches

    all_batches = AshWaterBatch.query.all()
    now = datetime.now()

    fabric_bonus = {}
    fabric_ph_offset = 0.0
    if fabric_type and fabric_type in Config.FABRIC_PROCESS_BONUS:
        fabric_bonus = Config.FABRIC_PROCESS_BONUS[fabric_type]
    if fabric_type and fabric_type in Config.FABRIC_PH_ADJUST:
        fabric_ph_offset = Config.FABRIC_PH_ADJUST[fabric_type]['offset']

    recommended_items = []
    not_recommended_items = []
    advice = []

    for batch in all_batches:
        ph_records = PhRecord.query.filter_by(batch_id=batch.id).order_by(PhRecord.measured_at.asc()).all()
        trend_analysis = analyze_ph_trend(ph_records)
        warning_result = detect_warnings(batch, ph_records, trend_analysis)
        filter_records = batch.filter_records
        process_rec = recommend_processes(batch, ph_records, trend_analysis, filter_records)

        total_used = sum(r.volume_used for r in batch.usage_records)
        remaining_volume = max(0.0, batch.water_volume - total_used)
        remaining_percent = (remaining_volume / batch.water_volume) * 100 if batch.water_volume > 0 else 0
        age_days = (now - batch.created_at).total_seconds() / 86400.0

        if remaining_volume < (min_volume or 0):
            continue

        process_scores = {}
        for rec in process_rec['recommended'] + process_rec['notRecommended']:
            process_name = rec['process']
            score = rec['score']
            if fabric_bonus and process_name in fabric_bonus:
                score = min(100.0, score * fabric_bonus[process_name])
            if fabric_ph_offset != 0:
                min_ph, max_ph = Config.PROCESS_PH_RANGES[process_name]
                effective_min = min_ph - fabric_ph_offset * 0.5
                effective_max = max_ph - fabric_ph_offset * 0.5
                if batch.current_ph is not None and effective_min <= batch.current_ph <= effective_max:
                    score = min(100.0, score + 3)
            process_scores[process_name] = rec
            process_scores[process_name]['score'] = round(score, 1)

        if process:
            target_rec = process_scores.get(process)
            if target_rec:
                final_score = target_rec['score']
            else:
                final_score = 0
        else:
            all_scores = [s['score'] for s in process_scores.values()]
            final_score = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

        process_recommendation = process_scores.get(process) if process else None

        item = {
            'batch': batch.to_dict(),
            'finalScore': final_score,
            'remainingVolume': round(remaining_volume, 1),
            'remainingPercent': round(remaining_percent, 1),
            'ageDays': round(age_days, 1),
            'warnings': warning_result,
            'processScores': process_scores,
            'processRecommendation': process_recommendation,
        }

        if (batch.usage_restricted or
            warning_result['warningLevel'] == 'high' or
            final_score < 50 or
            remaining_percent < 10):
            not_recommended_items.append(item)
        else:
            recommended_items.append(item)

    recommended_items.sort(key=lambda x: x['finalScore'], reverse=True)
    not_recommended_items.sort(key=lambda x: x['finalScore'], reverse=True)

    total_available = len(recommended_items) + len(not_recommended_items)

    if fabric_type:
        fabric_name = Config.FABRIC_TYPES.get(fabric_type, fabric_type)
        advice.append(f'已根据{fabric_name}面料特性调整工序推荐权重和PH适配阈值')
    if process:
        process_name = Config.PROCESS_NAMES.get(process, process)
        advice.append(f'当前以{process_name}工序为主要筛选目标进行推荐')
    if total_available == 0:
        advice.append('当前没有符合最小体积要求的批次，建议降低最小需求量或制备新批次')
    elif len(recommended_items) == 0:
        advice.append('目前所有可用批次评分较低，请谨慎选择并加强PH监测')

    return {
        'process': process,
        'processName': Config.PROCESS_NAMES.get(process) if process else None,
        'fabricType': fabric_type,
        'totalAvailable': total_available,
        'totalRecommended': len(recommended_items),
        'recommended': recommended_items,
        'notRecommended': not_recommended_items,
        'advice': advice,
    }
