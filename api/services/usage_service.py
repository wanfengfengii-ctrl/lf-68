from datetime import datetime
from api.models import db, UsageRecord
from api.utils import NotFoundError, BusinessRuleError
from api.services.batch_service import get_batch_by_id, determine_status, generate_id

def get_usage_records(batch_id):
    batch = get_batch_by_id(batch_id)
    records = UsageRecord.query.filter_by(batch_id=batch_id).order_by(UsageRecord.usage_date.asc()).all()
    return [r.to_dict() for r in records]

def add_usage_record(batch_id, data):
    batch = get_batch_by_id(batch_id)
    
    if batch.status == 'exhausted':
        raise BusinessRuleError('该批次已用尽，不能继续登记使用', 'exhausted')
    
    if not batch.is_applicable:
        raise BusinessRuleError('该批次当前不适用，请检查PH值', 'not_applicable')
    
    total_used = sum(ur.volume_used for ur in batch.usage_records)
    remaining = batch.water_volume - total_used
    
    if data.volumeUsed > remaining:
        raise BusinessRuleError(f'使用量超过剩余量，剩余: {remaining:.1f}L', 'volume_exceeded')
    
    record = UsageRecord(
        id=generate_id('usage'),
        batch_id=batch_id,
        usage_date=data.usageDate,
        process=data.process,
        volume_used=data.volumeUsed,
        used_by=data.usedBy,
        notes=data.notes
    )
    
    batch.updated_at = datetime.now()
    batch.status = determine_status(batch)
    
    db.session.add(record)
    db.session.commit()
    
    return record.to_dict()
