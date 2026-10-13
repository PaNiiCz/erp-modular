"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from apps.tarefas.apoio import EuView, SetoresView, UsuariosView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('auth/', include('social_django.urls', namespace='social')),
    path('api/', include('apps.clientes.urls')),
    path('api/', include('apps.produtos.urls')),
    path('api/', include('apps.estoque.urls')),
    path('api/', include('apps.vendas.urls')),
    path('api/', include('apps.financeiro.urls')),
    path('api/', include('apps.compras.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/relatorios/', include('apps.relatorios.urls')),
    path('api/rh/', include('apps.rh.urls')),
    path('api/agenda/', include('apps.agenda.urls')),
    path('api/', include('apps.tarefas.urls')),
    path("api/", include("apps.comunicados.urls")),
    path("api/apoio/eu/", EuView.as_view()),
    path("api/apoio/setores/", SetoresView.as_view()),
    path("api/apoio/usuarios/", UsuariosView.as_view()),
    path('api/administracao/', include('apps.administracao.urls')),
]