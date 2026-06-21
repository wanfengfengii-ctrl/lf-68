from flask import jsonify

class APIError(Exception):
    def __init__(self, message, status_code=400, data=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.data = data or {}

    def to_dict(self):
        return {
            'error': self.message,
            'code': self.status_code,
            **self.data
        }

class ValidationError(APIError):
    def __init__(self, message, field=None):
        data = {'field': field} if field else {}
        super().__init__(message, 400, data)

class NotFoundError(APIError):
    def __init__(self, resource, resource_id):
        super().__init__(f'{resource} ID {resource_id} 不存在', 404)

class ConflictError(APIError):
    def __init__(self, message):
        super().__init__(message, 409)

class BusinessRuleError(APIError):
    def __init__(self, message, rule=None):
        data = {'rule': rule} if rule else {}
        super().__init__(message, 422, data)

def handle_api_error(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

def handle_validation_error(error):
    return jsonify({
        'error': str(error),
        'code': 400
    }), 400

def handle_generic_error(error):
    return jsonify({
        'error': '服务器内部错误',
        'code': 500,
        'detail': str(error)
    }), 500
