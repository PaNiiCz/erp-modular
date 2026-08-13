from django.db import models


class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = 'Categoria'
        verbose_name_plural = 'Categorias'


class Marca(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = 'Marca'
        verbose_name_plural = 'Marcas'


class Fornecedor(models.Model):
    nome = models.CharField(max_length=150)
    cnpj = models.CharField(max_length=18, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = 'Fornecedor'
        verbose_name_plural = 'Fornecedores'


class Produto(models.Model):
    UNIDADES = [
        ('UN', 'Unidade'),
        ('KG', 'Quilograma'),
        ('L', 'Litro'),
        ('CX', 'Caixa'),
        ('PC', 'Pacote'),
    ]

    STATUS = [
        ('ATIVO', 'Ativo'),
        ('INATIVO', 'Inativo'),
        ('DESCONTINUADO', 'Descontinuado'),
    ]

    sku = models.CharField(max_length=50, unique=True)
    codigo_barras = models.CharField(max_length=50, blank=True, null=True)
    nome = models.CharField(max_length=200)
    descricao = models.TextField(blank=True, null=True)

    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True, related_name='produtos')
    marca = models.ForeignKey(Marca, on_delete=models.SET_NULL, null=True, blank=True, related_name='produtos')
    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.SET_NULL, null=True, blank=True, related_name='produtos')

    imagem = models.ImageField(upload_to='produtos/', blank=True, null=True)

    preco_custo = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    preco_venda = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    unidade = models.CharField(max_length=2, choices=UNIDADES, default='UN')
    estoque_minimo = models.PositiveIntegerField(default=0)

    status = models.CharField(max_length=20, choices=STATUS, default='ATIVO')

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.sku} - {self.nome}'

    class Meta:
        ordering = ['nome']
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'