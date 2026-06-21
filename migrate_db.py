import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import create_app
from api.models import db

app = create_app()

def migrate_database():
    with app.app_context():
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        if 'ash_water_batch' not in tables:
            print('未找到表，正在创建所有表...')
            db.create_all()
            print('✓ 所有表创建完成')
            print('\n数据库初始化完成！')
            return

        if 'dyeing_record' not in tables:
            print('正在创建染色记录表...')
            try:
                with db.engine.connect() as conn:
                    conn.execute(db.text('''
                        CREATE TABLE dyeing_record (
                            id VARCHAR(50) PRIMARY KEY,
                            batch_id VARCHAR(50) NOT NULL,
                            dyeing_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            fabric_type VARCHAR(100) NOT NULL,
                            target_color VARCHAR(100) NOT NULL,
                            dye_material VARCHAR(100) NOT NULL,
                            mordant_method VARCHAR(100) NOT NULL,
                            dye_concentration FLOAT NOT NULL,
                            heating_time_minutes INTEGER NOT NULL,
                            dyeing_count INTEGER NOT NULL DEFAULT 1,
                            redye_count INTEGER NOT NULL DEFAULT 0,
                            color_result VARCHAR(100),
                            color_fastness INTEGER,
                            process VARCHAR(50) NOT NULL,
                            notes TEXT,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (batch_id) REFERENCES ash_water_batch(id) ON DELETE CASCADE
                        )
                    '''))
                    conn.commit()
                print('✓ 染色记录表创建成功')
            except Exception as e:
                print(f'✗ 创建染色记录表失败: {e}')
        else:
            print('- 染色记录表已存在')

        existing_columns = [col['name'] for col in inspector.get_columns('ash_water_batch')]
        print(f"现有字段: {existing_columns}")

        new_columns = [
            ('has_warning', 'INTEGER DEFAULT 0'),
            ('usage_restricted', 'INTEGER DEFAULT 0'),
            ('warning_types', 'TEXT DEFAULT "[]"'),
            ('warning_level', 'TEXT'),
            ('last_warning_time', 'DATETIME'),
            ('last_ph_check_time', 'DATETIME'),
            ('ph_trend', 'TEXT DEFAULT "stable"'),
            ('ph_change_rate', 'FLOAT DEFAULT 0.0'),
            ('consecutive_abnormal_count', 'INTEGER DEFAULT 0'),
        ]

        for col_name, col_def in new_columns:
            if col_name not in existing_columns:
                try:
                    with db.engine.connect() as conn:
                        conn.execute(db.text(
                            f'ALTER TABLE ash_water_batch ADD COLUMN {col_name} {col_def}'
                        ))
                        conn.commit()
                    print(f'✓ 添加字段: {col_name}')
                except Exception as e:
                    print(f'✗ 添加字段 {col_name} 失败: {e}')
            else:
                print(f'- 字段已存在: {col_name}')

        print('\n数据库迁移完成！')

if __name__ == '__main__':
    migrate_database()
