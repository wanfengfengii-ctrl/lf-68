import uuid
from datetime import datetime
from api.models import db, AshWaterBatch
from api.config import Config
from api.utils import NotFoundError, ConflictError, BusinessRuleError

def generate_id(prefix='batch'):
    return f'{prefix}-{uuid.uuid4().hex[:8]}'

def get_applicability(ph_value):
    is_applicable = Config.APPLICABLE_PH_MIN <= ph_value <= Config.APPLICABLE_PH_MAX
    applicable_processes = []
    
    if is_applicable:
        for process, (min_ph, max_ph) in Config.PROCESS_PH_RANGES.items():
            if min_ph <= ph_value <= max_ph:
                applicable_processes.append(process)
    
    return is_applicable, applicable_processes

def determine_status(batch):
    if batch.status == 'exhausted':
        return 'exhausted'
    
    total_used = sum(ur.volume_used for ur in batch.usage_records)
    if total_used >= batch.water_volume * 0.95:
        return 'exhausted'
    
    if getattr(batch, 'usage_restricted', False):
        return 'not_applicable'
    
    if getattr(batch, 'has_warning', False) and getattr(batch, 'warning_level', None) == 'high':
        return 'warning'
    
    if not batch.is_applicable:
        return 'not_applicable'
    
    if batch.filter_count > 0 and batch.current_ph is not None:
        return 'available'
    
    if batch.filter_count > 0:
        return 'filtering'
    
    return 'soaking'

def get_all_batches(status=None, search=None):
    query = AshWaterBatch.query
    
    if status:
        query = query.filter(AshWaterBatch.status == status)
    
    if search:
        query = query.filter(
            AshWaterBatch.batch_number.contains(search) |
            AshWaterBatch.raw_material_source.contains(search)
        )
    
    batches = query.order_by(AshWaterBatch.created_at.desc()).all()
    return [batch.to_dict() for batch in batches]

def get_batch_by_id(batch_id):
    batch = AshWaterBatch.query.get(batch_id)
    if not batch:
        raise NotFoundError('批次', batch_id)
    return batch

def get_batch_detail(batch_id):
    batch = get_batch_by_id(batch_id)
    return batch.to_dict()

def create_batch(data):
    existing = AshWaterBatch.query.filter_by(batch_number=data.batchNumber).first()
    if existing:
        raise ConflictError(f'批次编号 {data.batchNumber} 已存在')
    
    batch = AshWaterBatch(
        id=generate_id(),
        batch_number=data.batchNumber,
        raw_material_source=data.rawMaterialSource,
        ash_weight=data.ashWeight,
        water_volume=data.waterVolume,
        soak_start_date=data.soakStartDate,
        soak_duration_hours=data.soakDurationHours,
        soak_temperature=data.soakTemperature,
        current_ph=data.currentPh,
        filter_count=0,
        status='soaking',
        is_applicable=False,
        applicable_processes=[]
    )
    
    if data.currentPh is not None:
        batch.is_applicable, batch.applicable_processes = get_applicability(data.currentPh)
        batch.status = determine_status(batch)
    
    db.session.add(batch)
    db.session.commit()
    
    return batch.to_dict()

def update_batch(batch_id, data):
    batch = get_batch_by_id(batch_id)
    
    if data.rawMaterialSource is not None:
        batch.raw_material_source = data.rawMaterialSource
    if data.ashWeight is not None:
        batch.ash_weight = data.ashWeight
    if data.waterVolume is not None:
        batch.water_volume = data.waterVolume
    if data.soakStartDate is not None:
        batch.soak_start_date = data.soakStartDate
    if data.soakDurationHours is not None:
        batch.soak_duration_hours = data.soakDurationHours
    if data.soakTemperature is not None:
        batch.soak_temperature = data.soakTemperature
    if data.currentPh is not None:
        batch.current_ph = data.currentPh
        batch.is_applicable, batch.applicable_processes = get_applicability(data.currentPh)
    if data.status is not None:
        batch.status = data.status
    if data.isApplicable is not None:
        batch.is_applicable = data.isApplicable
    if data.applicableProcesses is not None:
        batch.applicable_processes = data.applicableProcesses
    
    batch.status = determine_status(batch)
    batch.updated_at = datetime.now()
    
    db.session.commit()
    return batch.to_dict()

def delete_batch(batch_id):
    batch = get_batch_by_id(batch_id)
    db.session.delete(batch)
    db.session.commit()

def get_batch_applicability(batch_id):
    from api.services.analysis_service import run_full_analysis
    
    analysis_result = run_full_analysis(batch_id)
    batch = analysis_result['batch']
    
    if batch['currentPh'] is None:
        return {
            'currentPh': None,
            'isApplicable': False,
            'applicableProcesses': [],
            'message': '尚未检测PH值',
            'warnings': analysis_result['warnings'],
            'recommendations': analysis_result['recommendations'],
            'trendAnalysis': analysis_result['trendAnalysis'],
        }
    
    ph = batch['currentPh']
    is_applicable, applicable_processes = get_applicability(ph)
    
    process_details = []
    for process, (min_ph, max_ph) in Config.PROCESS_PH_RANGES.items():
        process_details.append({
            'process': process,
            'processName': Config.PROCESS_NAMES[process],
            'minPh': min_ph,
            'maxPh': max_ph,
            'isApplicable': min_ph <= ph <= max_ph
        })
    
    return {
        'currentPh': ph,
        'isApplicable': is_applicable,
        'applicableRange': {
            'min': Config.APPLICABLE_PH_MIN,
            'max': Config.APPLICABLE_PH_MAX
        },
        'applicableProcesses': applicable_processes,
        'processDetails': process_details,
        'status': Config.STATUS_NAMES.get(batch['status'], batch['status']),
        'warnings': analysis_result['warnings'],
        'recommendations': analysis_result['recommendations'],
        'trendAnalysis': analysis_result['trendAnalysis'],
    }
