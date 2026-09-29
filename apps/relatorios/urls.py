from django.urls import path
from .views import RelatorioVendasView, RelatorioFinanceiroView, RelatorioProdutosMaisVendidosView

urlpatterns = [
    path('vendas/', RelatorioVendasView.as_view(), name='relatorio-vendas'),
    path('financeiro/', RelatorioFinanceiroView.as_view(), name='relatorio-financeiro'),
    path('produtos-mais-vendidos/', RelatorioProdutosMaisVendidosView.as_view(), name='relatorio-produtos-mais-vendidos'),
]