from rest_framework.routers import SimpleRouter

from .views import ComunicadoViewSet

router = SimpleRouter()
router.register("comunicados", ComunicadoViewSet, basename="comunicado")

urlpatterns = router.urls