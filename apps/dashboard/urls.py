from django.urls import path
from .views import (
    ResumoDashboardView,
    ProdutosMaisVendidosView,
    GraficoVendasView,
    AtividadesRecentesView,
)

urlpatterns = [
    path('resumo/', ResumoDashboardView.as_view(), name='dashboard-resumo'),
    path('produtos-mais-vendidos/', ProdutosMaisVendidosView.as_view(), name='dashboard-produtos-mais-vendidos'),
    path('grafico-vendas/', GraficoVendasView.as_view(), name='dashboard-grafico-vendas'),
    path('atividades-recentes/', AtividadesRecentesView.as_view(), name='dashboard-atividades-recentes'),
]