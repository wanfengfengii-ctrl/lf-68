import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import create_app
from api.models import db, AshWaterBatch, PhRecord, FilterRecord, UsageRecord

app = create_app()

def init_database():
    with app.app_context():
        db.drop_all()
        db.create_all()
        
        batch1 = AshWaterBatch(
            id='batch-001',
            batch_number='AW-2024-001',
            raw_material_source='樟树灰烬',
            ash_weight=50,
            water_volume=200,
            soak_start_date=datetime.now() - timedelta(days=5),
            soak_duration_hours=72,
            soak_temperature=25,
            current_ph=11.2,
            filter_count=2,
            status='available',
            is_applicable=True,
            applicable_processes=['scouring', 'mordanting']
        )
        
        batch2 = AshWaterBatch(
            id='batch-002',
            batch_number='AW-2024-002',
            raw_material_source='稻草灰烬',
            ash_weight=30,
            water_volume=150,
            soak_start_date=datetime.now() - timedelta(days=2),
            soak_duration_hours=48,
            soak_temperature=20,
            current_ph=10.5,
            filter_count=1,
            status='available',
            is_applicable=True,
            applicable_processes=['dyeing']
        )
        
        batch3 = AshWaterBatch(
            id='batch-003',
            batch_number='AW-2024-003',
            raw_material_source='竹炭灰烬',
            ash_weight=40,
            water_volume=180,
            soak_start_date=datetime.now() - timedelta(days=1),
            soak_duration_hours=24,
            soak_temperature=22,
            current_ph=6.8,
            filter_count=0,
            status='soaking',
            is_applicable=False,
            applicable_processes=[]
        )
        
        db.session.add_all([batch1, batch2, batch3])
        db.session.commit()
        
        ph_records = [
            PhRecord(
                id='ph-001',
                batch_id='batch-001',
                ph_value=10.8,
                measured_at=datetime.now() - timedelta(days=4),
                measured_by='李师傅',
                notes='浸泡24小时后检测'
            ),
            PhRecord(
                id='ph-002',
                batch_id='batch-001',
                ph_value=11.5,
                measured_at=datetime.now() - timedelta(days=3),
                measured_by='李师傅',
                notes='浸泡48小时后检测'
            ),
            PhRecord(
                id='ph-003',
                batch_id='batch-001',
                ph_value=11.2,
                measured_at=datetime.now() - timedelta(days=2),
                measured_by='李师傅',
                notes='过滤后检测'
            ),
            PhRecord(
                id='ph-004',
                batch_id='batch-002',
                ph_value=9.5,
                measured_at=datetime.now() - timedelta(days=1),
                measured_by='王师傅',
                notes='浸泡24小时后检测'
            ),
            PhRecord(
                id='ph-005',
                batch_id='batch-002',
                ph_value=10.5,
                measured_at=datetime.now(),
                measured_by='王师傅',
                notes='浸泡48小时后检测'
            ),
            PhRecord(
                id='ph-006',
                batch_id='batch-003',
                ph_value=7.2,
                measured_at=datetime.now() - timedelta(hours=12),
                measured_by='张师傅',
                notes='浸泡12小时后检测'
            )
        ]
        
        db.session.add_all(ph_records)
        db.session.commit()
        
        filter_records = [
            FilterRecord(
                id='filter-001',
                batch_id='batch-001',
                filter_date=datetime.now() - timedelta(days=2, hours=1),
                filter_method='纱布粗滤',
                filter_count=1,
                notes='首次过滤'
            ),
            FilterRecord(
                id='filter-002',
                batch_id='batch-001',
                filter_date=datetime.now() - timedelta(days=2, hours=2),
                filter_method='滤纸精滤',
                filter_count=2,
                notes='二次过滤'
            ),
            FilterRecord(
                id='filter-003',
                batch_id='batch-002',
                filter_date=datetime.now() - timedelta(hours=2),
                filter_method='纱布过滤',
                filter_count=1,
                notes='首次过滤'
            )
        ]
        
        db.session.add_all(filter_records)
        db.session.commit()
        
        usage_records = [
            UsageRecord(
                id='usage-001',
                batch_id='batch-001',
                usage_date=datetime.now() - timedelta(days=1),
                process='scouring',
                volume_used=50,
                used_by='李师傅',
                notes='用于棉布精练'
            ),
            UsageRecord(
                id='usage-002',
                batch_id='batch-001',
                usage_date=datetime.now(),
                process='mordanting',
                volume_used=30,
                used_by='李师傅',
                notes='用于媒染工序'
            )
        ]
        
        db.session.add_all(usage_records)
        db.session.commit()
        
        print('数据库初始化完成！已创建3个批次、6条PH记录、3条过滤记录、2条使用记录')

if __name__ == '__main__':
    init_database()
