from datetime import datetime
from api.models import db, AshWaterBatch, DyeingRecord, PhRecord, FilterRecord, UsageRecord
from collections import defaultdict
import statistics


def get_batch_trace_chain(batch_id):
    batch = AshWaterBatch.query.get(batch_id)
    if not batch:
        return None

    ph_records = PhRecord.query.filter_by(batch_id=batch_id).order_by(PhRecord.measured_at.asc()).all()
    filter_records = FilterRecord.query.filter_by(batch_id=batch_id).order_by(FilterRecord.filter_date.asc()).all()
    usage_records = UsageRecord.query.filter_by(batch_id=batch_id).order_by(UsageRecord.usage_date.asc()).all()
    dyeing_records = DyeingRecord.query.filter_by(batch_id=batch_id).order_by(DyeingRecord.dyeing_date.desc()).all()

    total_used = sum(ur.volume_used for ur in usage_records)
    remaining = batch.water_volume - total_used

    success_count = sum(1 for dr in dyeing_records if dr.is_success)
    rework_count = sum(1 for dr in dyeing_records if dr.is_rework)
    failure_count = sum(1 for dr in dyeing_records if not dr.is_success)

    fastness_values = [dr.color_fastness for dr in dyeing_records if dr.color_fastness]
    avg_fastness = statistics.mean(fastness_values) if fastness_values else None
    std_fastness = statistics.stdev(fastness_values) if len(fastness_values) > 1 else 0

    dye_materials = defaultdict(int)
    mordant_methods = defaultdict(int)
    fabric_types = defaultdict(int)
    for dr in dyeing_records:
        dye_materials[dr.dye_material] += 1
        mordant_methods[dr.mordant_method] += 1
        fabric_types[dr.fabric_type] += 1

    return {
        'batch': batch.to_dict(),
        'summary': {
            'totalDyeingRecords': len(dyeing_records),
            'successCount': success_count,
            'reworkCount': rework_count,
            'failureCount': failure_count,
            'successRate': round((success_count / len(dyeing_records) * 100), 1) if dyeing_records else 0,
            'avgColorFastness': round(avg_fastness, 2) if avg_fastness else None,
            'stdColorFastness': round(std_fastness, 2),
            'avgRedyeCount': round(statistics.mean([dr.redye_count for dr in dyeing_records]), 2) if dyeing_records else 0,
            'totalUsedVolume': round(total_used, 2),
            'remainingVolume': round(remaining, 2),
            'phRecordCount': len(ph_records),
            'filterRecordCount': len(filter_records),
            'usageRecordCount': len(usage_records),
        },
        'stats': {
            'dyeMaterials': dict(dye_materials),
            'mordantMethods': dict(mordant_methods),
            'fabricTypes': dict(fabric_types),
        },
        'phRecords': [r.to_dict() for r in ph_records],
        'filterRecords': [r.to_dict() for r in filter_records],
        'usageRecords': [r.to_dict() for r in usage_records],
        'dyeingRecords': [r.to_dict() for r in dyeing_records],
    }


def analyze_by_raw_material(dye_material=None, fabric_type=None):
    query = DyeingRecord.query
    if dye_material:
        query = query.filter_by(dye_material=dye_material)
    if fabric_type:
        query = query.filter(DyeingRecord.fabric_type.like(f'%{fabric_type}%'))

    dyeing_records = query.all()

    source_groups = defaultdict(list)
    for dr in dyeing_records:
        if dr.batch and dr.batch.raw_material_source:
            source_groups[dr.batch.raw_material_source].append(dr)

    results = []
    for source, records in source_groups.items():
        success_count = sum(1 for r in records if r.is_success)
        rework_count = sum(1 for r in records if r.is_rework)
        fastness_values = [r.color_fastness for r in records if r.color_fastness]
        avg_fastness = statistics.mean(fastness_values) if fastness_values else None
        std_fastness = statistics.stdev(fastness_values) if len(fastness_values) > 1 else 0
        avg_redye = statistics.mean([r.redye_count for r in records])

        score = calculate_source_score(success_count, len(records), avg_fastness, std_fastness, avg_redye)

        results.append({
            'rawMaterialSource': source,
            'recordCount': len(records),
            'successCount': success_count,
            'reworkCount': rework_count,
            'failureCount': len(records) - success_count,
            'successRate': round((success_count / len(records) * 100), 1),
            'avgColorFastness': round(avg_fastness, 2) if avg_fastness else None,
            'stdColorFastness': round(std_fastness, 2),
            'avgRedyeCount': round(avg_redye, 2),
            'score': score,
            'grade': get_score_grade(score),
            'topDyeMaterials': get_top_items([r.dye_material for r in records], top_n=3),
            'topMordantMethods': get_top_items([r.mordant_method for r in records], top_n=3),
        })

    results.sort(key=lambda x: x['score'], reverse=True)

    return {
        'totalRecords': len(dyeing_records),
        'sourceCount': len(results),
        'groups': results,
    }


def analyze_by_ph_range(ph_ranges=None, dye_material=None, fabric_type=None):
    if ph_ranges is None:
        ph_ranges = [
            {'label': '低碱 (PH<9)', 'min': 0, 'max': 9},
            {'label': '中碱 (PH 9-11)', 'min': 9, 'max': 11},
            {'label': '高碱 (PH 11-13)', 'min': 11, 'max': 13},
            {'label': '强碱 (PH>13)', 'min': 13, 'max': 14},
        ]

    query = DyeingRecord.query
    if dye_material:
        query = query.filter_by(dye_material=dye_material)
    if fabric_type:
        query = query.filter(DyeingRecord.fabric_type.like(f'%{fabric_type}%'))

    dyeing_records = query.all()

    results = []
    for ph_range in ph_ranges:
        records_in_range = []
        for dr in dyeing_records:
            if dr.batch and dr.batch.current_ph is not None:
                if ph_range['min'] <= dr.batch.current_ph < ph_range['max']:
                    records_in_range.append(dr)

        if not records_in_range:
            continue

        success_count = sum(1 for r in records_in_range if r.is_success)
        rework_count = sum(1 for r in records_in_range if r.is_rework)
        fastness_values = [r.color_fastness for r in records_in_range if r.color_fastness]
        avg_fastness = statistics.mean(fastness_values) if fastness_values else None
        std_fastness = statistics.stdev(fastness_values) if len(fastness_values) > 1 else 0
        avg_redye = statistics.mean([r.redye_count for r in records_in_range])
        avg_ph = statistics.mean([r.batch.current_ph for r in records_in_range if r.batch and r.batch.current_ph])

        score = calculate_source_score(success_count, len(records_in_range), avg_fastness, std_fastness, avg_redye)

        results.append({
            'phRange': ph_range['label'],
            'phMin': ph_range['min'],
            'phMax': ph_range['max'],
            'avgPh': round(avg_ph, 2),
            'recordCount': len(records_in_range),
            'successCount': success_count,
            'reworkCount': rework_count,
            'failureCount': len(records_in_range) - success_count,
            'successRate': round((success_count / len(records_in_range) * 100), 1),
            'avgColorFastness': round(avg_fastness, 2) if avg_fastness else None,
            'stdColorFastness': round(std_fastness, 2),
            'avgRedyeCount': round(avg_redye, 2),
            'score': score,
            'grade': get_score_grade(score),
        })

    return {
        'totalRecords': len(dyeing_records),
        'rangeCount': len(results),
        'groups': results,
    }


def analyze_by_filter_count(filter_ranges=None, dye_material=None, fabric_type=None):
    if filter_ranges is None:
        filter_ranges = [
            {'label': '未过滤 (0次)', 'min': 0, 'max': 1},
            {'label': '轻度过滤 (1-2次)', 'min': 1, 'max': 3},
            {'label': '中度过滤 (3-5次)', 'min': 3, 'max': 6},
            {'label': '深度过滤 (5次以上)', 'min': 5, 'max': 100},
        ]

    query = DyeingRecord.query
    if dye_material:
        query = query.filter_by(dye_material=dye_material)
    if fabric_type:
        query = query.filter(DyeingRecord.fabric_type.like(f'%{fabric_type}%'))

    dyeing_records = query.all()

    results = []
    for f_range in filter_ranges:
        records_in_range = []
        for dr in dyeing_records:
            if dr.batch is not None:
                filter_count = dr.batch.filter_count or 0
                if f_range['min'] <= filter_count < f_range['max']:
                    records_in_range.append(dr)

        if not records_in_range:
            continue

        success_count = sum(1 for r in records_in_range if r.is_success)
        rework_count = sum(1 for r in records_in_range if r.is_rework)
        fastness_values = [r.color_fastness for r in records_in_range if r.color_fastness]
        avg_fastness = statistics.mean(fastness_values) if fastness_values else None
        std_fastness = statistics.stdev(fastness_values) if len(fastness_values) > 1 else 0
        avg_redye = statistics.mean([r.redye_count for r in records_in_range])
        avg_filter = statistics.mean([r.batch.filter_count for r in records_in_range if r.batch])

        score = calculate_source_score(success_count, len(records_in_range), avg_fastness, std_fastness, avg_redye)

        results.append({
            'filterRange': f_range['label'],
            'filterMin': f_range['min'],
            'filterMax': f_range['max'],
            'avgFilterCount': round(avg_filter, 1),
            'recordCount': len(records_in_range),
            'successCount': success_count,
            'reworkCount': rework_count,
            'failureCount': len(records_in_range) - success_count,
            'successRate': round((success_count / len(records_in_range) * 100), 1),
            'avgColorFastness': round(avg_fastness, 2) if avg_fastness else None,
            'stdColorFastness': round(std_fastness, 2),
            'avgRedyeCount': round(avg_redye, 2),
            'score': score,
            'grade': get_score_grade(score),
        })

    return {
        'totalRecords': len(dyeing_records),
        'rangeCount': len(results),
        'groups': results,
    }


def get_comprehensive_analysis(dye_material=None, fabric_type=None, process=None):
    source_analysis = analyze_by_raw_material(dye_material=dye_material, fabric_type=fabric_type)
    ph_analysis = analyze_by_ph_range(dye_material=dye_material, fabric_type=fabric_type)
    filter_analysis = analyze_by_filter_count(dye_material=dye_material, fabric_type=fabric_type)

    all_records = []
    query = DyeingRecord.query
    if dye_material:
        query = query.filter_by(dye_material=dye_material)
    if fabric_type:
        query = query.filter(DyeingRecord.fabric_type.like(f'%{fabric_type}%'))
    if process:
        query = query.filter_by(process=process)
    dyeing_records = query.all()

    success_count = sum(1 for r in dyeing_records if r.is_success)
    rework_count = sum(1 for r in dyeing_records if r.is_rework)
    fastness_values = [r.color_fastness for r in dyeing_records if r.color_fastness]
    avg_fastness = statistics.mean(fastness_values) if fastness_values else None
    avg_redye = statistics.mean([r.redye_count for r in dyeing_records]) if dyeing_records else 0

    recommendations = []
    if source_analysis['groups']:
        best_source = source_analysis['groups'][0]
        recommendations.append({
            'type': 'raw_material',
            'title': '最佳原料来源',
            'content': f"推荐使用「{best_source['rawMaterialSource']}」来源的草木灰，成功率 {best_source['successRate']}%，综合评分 {best_source['score']}",
            'score': best_source['score'],
        })

    if ph_analysis['groups']:
        best_ph = ph_analysis['groups'][0]
        recommendations.append({
            'type': 'ph_range',
            'title': '最佳PH区间',
            'content': f"推荐在 {best_ph['phRange']} 范围内进行染色，成功率 {best_ph['successRate']}%，综合评分 {best_ph['score']}",
            'score': best_ph['score'],
        })

    if filter_analysis['groups']:
        best_filter = filter_analysis['groups'][0]
        recommendations.append({
            'type': 'filter_count',
            'title': '最佳过滤次数',
            'content': f"推荐 {best_filter['filterRange']} 的灰水进行染色，成功率 {best_filter['successRate']}%，综合评分 {best_filter['score']}",
            'score': best_filter['score'],
        })

    return {
        'overview': {
            'totalRecords': len(dyeing_records),
            'successCount': success_count,
            'reworkCount': rework_count,
            'failureCount': len(dyeing_records) - success_count,
            'successRate': round((success_count / len(dyeing_records) * 100), 1) if dyeing_records else 0,
            'avgColorFastness': round(avg_fastness, 2) if avg_fastness else None,
            'avgRedyeCount': round(avg_redye, 2),
        },
        'byRawMaterial': source_analysis,
        'byPhRange': ph_analysis,
        'byFilterCount': filter_analysis,
        'recommendations': recommendations,
    }


def get_rework_statistics(dye_material=None, fabric_type=None):
    query = DyeingRecord.query
    if dye_material:
        query = query.filter_by(dye_material=dye_material)
    if fabric_type:
        query = query.filter(DyeingRecord.fabric_type.like(f'%{fabric_type}%'))

    dyeing_records = query.all()

    rework_records = [r for r in dyeing_records if r.is_rework]
    failure_records = [r for r in dyeing_records if not r.is_success]

    rework_reasons = defaultdict(int)
    failure_reasons = defaultdict(int)
    for r in rework_records:
        if r.rework_reason:
            rework_reasons[r.rework_reason] += 1
    for r in failure_records:
        if r.failure_reason:
            failure_reasons[r.failure_reason] += 1

    by_material = defaultdict(lambda: {'total': 0, 'rework': 0, 'failure': 0})
    for r in dyeing_records:
        by_material[r.dye_material]['total'] += 1
        if r.is_rework:
            by_material[r.dye_material]['rework'] += 1
        if not r.is_success:
            by_material[r.dye_material]['failure'] += 1

    material_stats = []
    for material, stats in by_material.items():
        material_stats.append({
            'dyeMaterial': material,
            'total': stats['total'],
            'reworkCount': stats['rework'],
            'failureCount': stats['failure'],
            'reworkRate': round((stats['rework'] / stats['total'] * 100), 1) if stats['total'] > 0 else 0,
            'failureRate': round((stats['failure'] / stats['total'] * 100), 1) if stats['total'] > 0 else 0,
        })

    material_stats.sort(key=lambda x: x['reworkRate'], reverse=True)

    return {
        'totalRecords': len(dyeing_records),
        'reworkCount': len(rework_records),
        'failureCount': len(failure_records),
        'reworkRate': round((len(rework_records) / len(dyeing_records) * 100), 1) if dyeing_records else 0,
        'failureRate': round((len(failure_records) / len(dyeing_records) * 100), 1) if dyeing_records else 0,
        'reworkReasons': dict(sorted(rework_reasons.items(), key=lambda x: x[1], reverse=True)),
        'failureReasons': dict(sorted(failure_reasons.items(), key=lambda x: x[1], reverse=True)),
        'byMaterial': material_stats,
    }


def calculate_source_score(success_count, total_count, avg_fastness, std_fastness, avg_redye):
    score = 100.0

    success_rate = success_count / total_count if total_count > 0 else 0
    score -= (1 - success_rate) * 30

    if avg_fastness is not None:
        score -= (5 - avg_fastness) * 8
    else:
        score -= 10

    score -= std_fastness * 10

    score -= avg_redye * 5

    if total_count < 5:
        score -= 5

    return max(0, min(100, round(score, 1)))


def get_score_grade(score):
    if score >= 85:
        return 'excellent'
    elif score >= 70:
        return 'good'
    elif score >= 55:
        return 'fair'
    elif score >= 40:
        return 'poor'
    else:
        return 'unstable'


def get_top_items(items, top_n=3):
    counts = defaultdict(int)
    for item in items:
        counts[item] += 1
    sorted_items = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return [{'item': k, 'count': v} for k, v in sorted_items[:top_n]]
