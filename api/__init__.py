from flask import Flask
from flask_cors import CORS
from api.config import Config
from api.models import db
from api.routes import batches_bp, ph_records_bp, filter_records_bp, usage_records_bp
from api.utils import APIError, handle_api_error, handle_generic_error

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)
    
    db.init_app(app)
    
    app.register_blueprint(batches_bp, url_prefix='/api/batches')
    app.register_blueprint(ph_records_bp, url_prefix='/api/batches')
    app.register_blueprint(filter_records_bp, url_prefix='/api/batches')
    app.register_blueprint(usage_records_bp, url_prefix='/api/batches')
    
    @app.route('/api/health')
    def health_check():
        return {'status': 'ok', 'message': '草木灰水管理系统 API 运行正常' }
    
    @app.route('/api/config')
    def get_config():
        from api.config import Config
        return {
            'processNames': Config.PROCESS_NAMES,
            'statusNames': Config.STATUS_NAMES,
            'processPhRanges': Config.PROCESS_PH_RANGES,
            'applicableRange': {
                'min': Config.APPLICABLE_PH_MIN,
                'max': Config.APPLICABLE_PH_MAX
            },
            'warningConfig': Config.WARNING_CONFIG,
            'warningTypes': Config.WARNING_TYPES,
            'warningLevels': Config.WARNING_LEVELS,
            'fabricTypes': Config.FABRIC_TYPES,
            'dyeMaterials': Config.DYE_MATERIALS,
            'mordantMethods': Config.MORDANT_METHODS,
        }
    
    app.register_error_handler(APIError, handle_api_error)
    app.register_error_handler(Exception, handle_generic_error)
    
    return app
