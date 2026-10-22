"""
ACTIVIDAD ACADÉMICA: 4 PRUEBAS UNITARIAS EN PYTHON
Curso: Calidad de Software (UCV 2026)
Sistema de Información: Sistema de Ventas e Inventario Textil (Multi-Módulo)

4 funciones representativas de los 4 módulos esenciales del negocio:
1. Módulo Inventario/Catálogo   : validar_producto()
2. Módulo Ventas y Caja         : calcular_total_venta()
3. Módulo Almacén/Stock         : descontar_stock()
4. Módulo Conciliación/Auditoría: calcular_porcentaje_diferencia()

Ejecución directa:
    python ejemplo_pruebas_unitarias.py
"""

import unittest


# ===========================================================================
# 1. MÓDULO INVENTARIO: Validar datos al registrar un producto textil
# ===========================================================================
def validar_producto(sku: str, nombre: str, precio: float, stock: int) -> bool:
    """Verifica que el producto textil tenga datos válidos (precio > 0, stock >= 0)."""
    if not sku.strip() or not nombre.strip():
        return False
    if precio <= 0 or stock < 0:
        return False
    return True


# ===========================================================================
# 2. MÓDULO VENTAS: Calcular total de venta con IGV (18%) y descuento
# ===========================================================================
def calcular_total_venta(cantidad: int, precio_unitario: float, descuento_pct: float = 0.0) -> float:
    """Calcula el total a pagar: (Subtotal - Descuento) + IGV (18%)."""
    if cantidad <= 0 or precio_unitario <= 0 or descuento_pct < 0 or descuento_pct > 100:
        raise ValueError("Valores inválidos para venta.")
    subtotal = cantidad * precio_unitario
    monto_descuento = subtotal * (descuento_pct / 100)
    base_imponible = subtotal - monto_descuento
    igv = base_imponible * 0.18
    return round(base_imponible + igv, 2)


# ===========================================================================
# 3. MÓDULO ALMACÉN: Descontar stock al realizar una salida o despacho
# ===========================================================================
def descontar_stock(stock_actual: int, cantidad_a_descontar: int) -> int:
    """Resta unidades del inventario evitando existencias negativas."""
    if cantidad_a_descontar <= 0:
        raise ValueError("La cantidad a descontar debe ser mayor a 0.")
    if cantidad_a_descontar > stock_actual:
        raise ValueError("Stock insuficiente para despachar.")
    return stock_actual - cantidad_a_descontar


# ===========================================================================
# 4. MÓDULO CONCILIACIÓN: Evaluar merma entre conteo físico y sistema
# ===========================================================================
def calcular_porcentaje_diferencia(stock_sistema: int, conteo_fisico: int) -> dict:
    """Calcula la desviación porcentual de inventario y si está dentro de la tolerancia (<= 2%)."""
    if stock_sistema <= 0:
        return {"diferencia": 0, "porcentaje": 0.0, "conforme": True}
    diferencia = conteo_fisico - stock_sistema
    porcentaje = round(abs(diferencia) / stock_sistema * 100, 2)
    conforme = porcentaje <= 2.0  # Umbral de tolerancia de merma textil: 2%
    return {
        "diferencia": diferencia,
        "porcentaje": porcentaje,
        "conforme": conforme,
    }


# ===========================================================================
# LAS 4 PRUEBAS UNITARIAS (1 POR CADA MÓDULO DEL SISTEMA)
# ===========================================================================

class TestSistemaTextil(unittest.TestCase):

    def test_01_validar_producto_inventario(self):
        """Prueba 1 (Inventario): Validar registro correcto de 'Tela Algodon Pima'."""
        es_valido = validar_producto(
            sku="TEL-001",
            nombre="Tela Algodon Pima",
            precio=25.50,
            stock=40
        )
        self.assertTrue(es_valido)

    def test_02_calcular_total_ventas(self):
        """Prueba 2 (Ventas): 2 rollos a S/ 50 con 10% desc + IGV 18% debe dar S/ 106.20."""
        # Subtotal: 100 - Desc 10% = 90 base + IGV 18% (16.20) = 106.20
        total = calcular_total_venta(cantidad=2, precio_unitario=50.00, descuento_pct=10.0)
        self.assertEqual(total, 106.20)

    def test_03_descontar_stock_almacen(self):
        """Prueba 3 (Almacen): De 50 rollos en stock se despachan 15, deben quedar 35."""
        nuevo_stock = descontar_stock(stock_actual=50, cantidad_a_descontar=15)
        self.assertEqual(nuevo_stock, 35)

    def test_04_conciliacion_auditoria(self):
        """Prueba 4 (Conciliacion): Sistema 100 m vs Fisico 99 m (1% de merma) debe ser CONFORME."""
        resultado = calcular_porcentaje_diferencia(stock_sistema=100, conteo_fisico=99)
        self.assertEqual(resultado["porcentaje"], 1.0)
        self.assertTrue(resultado["conforme"])


# ===========================================================================
# REPORTE VISUAL EN CONSOLA (Entrada vs Resultado Esperado vs Obtenido)
# ===========================================================================

def imprimir_resumen_visual():
    print("=" * 80)
    print(" ACTIVIDAD: 4 PRUEBAS UNITARIAS MULTI-MODULO - SISTEMA TEXTILERIA")
    print("=" * 80)

    # 1. Inventario
    res1 = validar_producto("TEL-001", "Tela Algodon Pima", 25.50, 40)
    # 2. Ventas
    res2 = calcular_total_venta(2, 50.00, 10.0)
    # 3. Almacen
    res3 = descontar_stock(50, 15)
    # 4. Conciliacion
    res4 = calcular_porcentaje_diferencia(100, 99)

    casos = [
        (
            "1. Inventario (Catalogo de Telas)",
            "SKU: 'TEL-001' | Pima | S/ 25.50 | Stock: 40",
            True,
            res1,
            "True (Valido)",
            "True (Valido)",
        ),
        (
            "2. Ventas (Caja y Facturacion)",
            "Cant: 2 rollos | Precio: S/ 50.00 | Desc: 10% | IGV: 18%",
            106.20,
            res2,
            "S/ 106.20",
            f"S/ {res2:.2f}",
        ),
        (
            "3. Almacen (Control de Stock)",
            "Stock inicial: 50 m | Salida despachada: 15 m",
            35,
            res3,
            "35 metros",
            f"{res3} metros",
        ),
        (
            "4. Conciliacion (Mermas y Auditoria)",
            "Sistema: 100 m | Conteo Fisico: 99 m (Tolerancia: <= 2%)",
            True,
            res4["conforme"],
            "Conforme (Merma: 1.00%)",
            f"Conforme (Merma: {res4['porcentaje']:.2f}%)",
        ),
    ]

    for modulo, entrada, val_esp, val_obt, txt_esp, txt_obt in casos:
        estado = "[APROBADO]" if val_esp == val_obt else "[FALLIDO]"
        print(f"Modulo     : {modulo}")
        print(f"Entrada    : {entrada}")
        print(f"Esperado   : {txt_esp}")
        print(f"Obtenido   : {txt_obt}")
        print(f"Resultado  : {estado}")
        print("-" * 80)
    import sys
    sys.stdout.flush()


if __name__ == "__main__":
    imprimir_resumen_visual()
    print("\nEjecutando verificacion formal con unittest:")
    import sys
    sys.stdout.flush()
    unittest.main(verbosity=2)
