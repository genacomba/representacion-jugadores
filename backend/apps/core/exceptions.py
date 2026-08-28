from rest_framework.views import exception_handler as drf_exception_handler


def api_exception_handler(exc, context):
    """
    Wraps DRF's default handler so every error response has a predictable
    shape: {"detail": "...", "errors": {...}} instead of ad-hoc formats per
    exception type. The frontend relies on this to render form/API errors
    without special-casing each endpoint.
    """
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    if isinstance(data, dict) and "detail" in data and len(data) == 1:
        response.data = {"detail": data["detail"]}
    else:
        detail = data.get("detail") if isinstance(data, dict) else None
        response.data = {
            "detail": detail or "Se encontraron errores de validación.",
            "errors": data,
        }
    return response
