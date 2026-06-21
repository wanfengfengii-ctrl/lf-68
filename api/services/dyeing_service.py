from datetime import datetime
from api.models import db, DyeingRecord
from api.utils import NotFoundError, BusinessRuleError
from api.services.batch_service import get_batch_by_id, generate_id
from collections import defaultdict
import statistics

def get_dyeing_records(batch_id=None, fabric_type=None, target_color=None, process=None):
    query = DyeingRecord.query
    
    if batch_id:
        query = query.filter_by(batch_id=batch_id)
    if fabric_type:
        query = query.filter(DyeingRecord.fabric_type.like(f'%{fabric_type}%'))
    if target_color:
        query = query.filter(DyeingRecord.target_color.like(f'%{target_color}%'))
    if process:
        query = query.filter_by(process=process)
    
    records = query.order_by(DyeingRecord.dyeing_date.desc()).all()
    return [r.to_dict() for r in records]

def get_dyeing_record_by_id(record_id):
    record = DyeingRecord.query.get(record_id)
    if not record:
        raise NotFoundError(f'染色记录不存在: {record_id}')
    return record

def get_dyeing_record_detail(record_id):
    record = get_dyeing_record_by_id(record_id)
    return record.to_dict()

def add_dyeing_record(batch_id, data):
    batch = get_batch_by_id(batch_id)
    
    record = DyeingRecord(
        id=generate_id('dyeing'),
        batch_id=batch_id,
        dyeing_date=data.dyeingDate,
        fabric_type=data.fabricType,
        target_color=data.targetColor,
        dye_material=data.dyeMaterial,
        mordant_method=data.mordantMethod,
        dye_concentration=data.dyeConcentration,
        heating_time_minutes=data.heatingTimeMinutes,
        dyeing_count=data.dyeingCount,
        redye_count=data.redyeCount,
        color_result=data.colorResult,
        color_fastness=data.colorFastness,
        process=data.process,
        notes=data.notes
    )
    
    db.session.add(record)
    db.session.commit()
    
    return record.to_dict()

def update_dyeing_record(record_id, data):
    record = get_dyeing_record_by_id(record_id)
    
    update_data = data.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        if key == 'dyeingDate':
            setattr(record, 'dyeing_date', value)
        elif key == 'fabricType':
            setattr(record, 'fabric_type', value)
        elif key == 'targetColor':
            setattr(record, 'target_color', value)
        elif key == 'dyeMaterial':
            setattr(record, 'dye_material', value)
        elif key == 'mordantMethod':
            setattr(record, 'mordant_method', value)
        elif key == 'dyeConcentration':
            setattr(record, 'dye_concentration', value)
        elif key == 'heatingTimeMinutes':
            setattr(record, 'heating_time_minutes', value)
        elif key == 'dyeingCount':
            setattr(record, 'dyeing_count', value)
        elif key == 'redyeCount':
            setattr(record, 'redye_count', value)
        elif key == 'colorResult':
            setattr(record, 'color_result', value)
        elif key == 'colorFastness':
            setattr(record, 'color_fastness', value)
        elif value is not None:
            setattr(record, key, value)
    
    record.updated_at = datetime.now()
    db.session.commit()
    
    return record.to_dict()

def delete_dyeing_record(record_id):
    record = get_dyeing_record_by_id(record_id)
    db.session.delete(record)
    db.session.commit()

def trace_dyeing_process(fabric_type=None, target_color=None, process=None):
    records = get_dyeing_records(
        fabric_type=fabric_type,
        target_color=target_color,
        process=process
    )
    
    grouped = defaultdict(list)
    for r in records:
        key = (r['fabricType'], r['targetColor'], r['process'])
        grouped[key].append(r)
    
    result = []
    for (fabric, color, proc), recs in grouped.items():
        recs_sorted = sorted(recs, key=lambda x: x['dyeingDate'], reverse=True)
        result.append({
            'fabricType': fabric,
            'targetColor': color,
            'process': proc,
            'recordCount': len(recs_sorted),
            'records': recs_sorted
        })
    
    return sorted(result, key=lambda x: x['recordCount'], reverse=True)

def analyze_recipe_stability(fabric_type=None, target_color=None, process=None):
    records = get_dyeing_records(
        fabric_type=fabric_type,
        target_color=target_color,
        process=process
    )
    
    if len(records) < 2:
        return {
            'message': '记录不足，无法进行稳定性分析（至少需要2条记录）',
            'totalRecords': len(records),
            'recipeGroups': []
        }
    
    recipe_groups = defaultdict(list)
    for r in records:
        key = (
            r['batchId'],
            r['dyeMaterial'],
            r['mordantMethod'],
            round(r['dyeConcentration'], 1),
            r['heatingTimeMinutes'],
            r['dyeingCount'],
            r['fabricType'],
            r['targetColor']
        )
        recipe_groups[key].append(r)
    
    analyzed_groups = []
    for key, group_records in recipe_groups.items():
        batch_id, dye_material, mordant_method, concentration, heating_time, dyeing_count, fabric, color = key
        
        if len(group_records) < 2:
            continue
        
        fastness_values = [r['colorFastness'] for r in group_records if r['colorFastness']]
        redye_counts = [r['redyeCount'] for r in group_records]
        
        avg_fastness = statistics.mean(fastness_values) if fastness_values else None
        std_fastness = statistics.stdev(fastness_values) if len(fastness_values) > 1 else 0
        avg_redye = statistics.mean(redye_counts)
        success_rate = sum(1 for r in group_records if r['colorResult'] and r['colorResult'] != '失败') / len(group_records)
        
        stability_score = calculate_stability_score(std_fastness, success_rate, avg_redye)
        
        analyzed_groups.append({
            'batchId': batch_id,
            'batchNumber': group_records[0]['batchNumber'],
            'dyeMaterial': dye_material,
            'mordantMethod': mordant_method,
            'dyeConcentration': concentration,
            'heatingTimeMinutes': heating_time,
            'dyeingCount': dyeing_count,
            'fabricType': fabric,
            'targetColor': color,
            'recordCount': len(group_records),
            'avgColorFastness': round(avg_fastness, 2) if avg_fastness else None,
            'stdColorFastness': round(std_fastness, 2),
            'avgRedyeCount': round(avg_redye, 2),
            'successRate': round(success_rate * 100, 1),
            'stabilityScore': stability_score,
            'stabilityLevel': get_stability_level(stability_score),
            'recommendation': get_recommendation(stability_score, group_records),
            'sampleRecords': group_records[:5]
        })
    
    analyzed_groups.sort(key=lambda x: x['stabilityScore'], reverse=True)
    
    return {
        'totalRecords': len(records),
        'analyzedGroups': len(analyzed_groups),
        'recipeGroups': analyzed_groups
    }

def calculate_stability_score(std_fastness, success_rate, avg_redye):
    score = 100.0
    
    score -= std_fastness * 15
    
    score -= (1 - success_rate) * 40
    
    score -= avg_redye * 8
    
    return max(0, min(100, score))

def get_stability_level(score):
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

def get_recommendation(score, records):
    if score >= 85:
        return '该配方稳定性优秀，推荐作为标准配方使用'
    elif score >= 70:
        return '该配方稳定性良好，可继续使用，建议小幅优化'
    elif score >= 55:
        return '该配方稳定性一般，建议调整染液浓度或加热时间'
    elif score >= 40:
        return '该配方稳定性较差，建议更换媒染方式或染材批次'
    else:
        return '该配方稳定性极差，不推荐继续使用，请重新设计配方'

def get_recipe_recommendation(fabric_type, target_color, process=None):
    analysis = analyze_recipe_stability(
        fabric_type=fabric_type,
        target_color=target_color,
        process=process
    )
    
    if not analysis['recipeGroups']:
        return {
            'hasRecommendation': False,
            'message': '未找到匹配的历史配方数据',
            'suggestions': []
        }
    
    best_recipe = analysis['recipeGroups'][0]
    
    suggestions = []
    if best_recipe['avgRedyeCount'] > 2:
        suggestions.append('建议增加初始染液浓度，减少复染次数')
    if best_recipe['stdColorFastness'] > 0.5:
        suggestions.append('色牢度波动较大，建议严格控制加热时间和染液浓度')
    if best_recipe['successRate'] < 80:
        suggestions.append('成功率偏低，建议验证草木灰水批次的PH值稳定性')
    
    return {
        'hasRecommendation': True,
        'bestRecipe': best_recipe,
        'alternatives': analysis['recipeGroups'][1:3],
        'suggestions': suggestions,
        'redyeAdvice': generate_redye_advice(best_recipe),
        'processOptimization': generate_process_optimization(best_recipe)
    }

def generate_redye_advice(recipe):
    if recipe['avgRedyeCount'] == 0:
        return '该配方通常无需复染，一次染色即可达到预期效果'
    elif recipe['avgRedyeCount'] <= 1:
        return f'建议预留复染1次的染液，经验数据显示约{recipe["avgRedyeCount"]:.1f}次复染可达到最佳效果'
    elif recipe['avgRedyeCount'] <= 2:
        return f'该配方通常需要复染{recipe["avgRedyeCount"]:.1f}次，建议分批次染液以保证浓度稳定'
    else:
        return f'该配方复染次数较多（平均{recipe["avgRedyeCount"]:.1f}次），建议优化初始染色工艺减少复染'

def generate_process_optimization(recipe):
    optimizations = []
    
    if recipe['heatingTimeMinutes'] > 120:
        optimizations.append({
            'parameter': '加热时间',
            'current': f'{recipe["heatingTimeMinutes"]}分钟',
            'suggestion': '尝试降低加热温度延长保温时间，或缩短加热时间提高温度',
            'expectedBenefit': '降低能源消耗，减少染料分解'
        })
    
    if recipe['dyeConcentration'] > 80:
        optimizations.append({
            'parameter': '染液浓度',
            'current': f'{recipe["dyeConcentration"]}%',
            'suggestion': '高浓度染液可能导致染色不均，建议分次染色',
            'expectedBenefit': '提高染色均匀度，减少染料浪费'
        })
    
    if recipe['dyeingCount'] > 3:
        optimizations.append({
            'parameter': '染色次数',
            'current': f'{recipe["dyeingCount"]}次',
            'suggestion': '多次染色可能损伤布料，考虑提高单次染液浓度',
            'expectedBenefit': '提高工作效率，保护布料纤维'
        })
    
    return optimizations
