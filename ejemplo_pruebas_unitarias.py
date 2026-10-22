"""
MIGRACIÓN DE JAVA A PYTHON: 4 PRUEBAS UNITARIAS (SISTEMA TEXTILERÍA)
Código original en Java migrado a Python con soporte de unittest.
"""

import unittest


class SistemaTextil:

    # ==========================================
    # 1. MÓDULO DE VENTAS: FACTURACIÓN
    # ==========================================
    @staticmethod
    def calcular_facturacion(cantidad_metros: float, precio_unitario: float, descuento: float) -> float:
        """Calcula el total de la venta incluyendo descuento e IGV (18%)."""
        if cantidad_metros < 0 or precio_unitario < 0:
            raise ValueError("Cantidades inválidas")

        subtotal = cantidad_metros * precio_unitario
        monto_descuento = subtotal * descuento
        valor_venta = subtotal - monto_descuento
        igv = valor_venta * 0.18
        total = valor_venta + igv

        return round(total, 2)

    # ==========================================
    # 2. MÓDULO DE INVENTARIO: ALERTA DE STOCK
    # ==========================================
    @staticmethod
    def verificar_alerta_stock(stock_actual: int, stock_minimo: int) -> str:
        """Verifica si el inventario está en el nivel mínimo o por debajo."""
        if stock_actual <= stock_minimo:
            return "ALERTA: Stock crítico"
        return "Stock normal"

    # ==========================================
    # 3. MÓDULO DE INVENTARIO: TRAZABILIDAD
    # ==========================================
    @staticmethod
    def registrar_despacho(stock_actual: int, cantidad_despachada: int) -> int:
        """Registra un despacho descontando las unidades del stock."""
        if cantidad_despachada > stock_actual:
            raise ValueError("Stock insuficiente")
        return stock_actual - cantidad_despachada

    # ==========================================
    # 4. MÓDULO DE REPORTES: ROTACIÓN
    # ==========================================
    @staticmethod
    def calcular_rotacion_inventario(costo_bienes_vendidos: float, inventario_promedio: float) -> float:
        """Calcula la rotación del inventario."""
        if inventario_promedio <= 0:
            raise ValueError("Inventario promedio inválido")

        rotacion = costo_bienes_vendidos / inventario_promedio
        return round(rotacion, 2)


# ==========================================
# PRUEBAS UNITARIAS EQUIVALENTES A JUNIT
# ==========================================

class TestSistemaTextil(unittest.TestCase):

    def test_01_calcular_facturacion(self):
        """PRUEBA 1: FACTURACION CON IGV (10 m de Tela Jersey a S/ 15.20 con 10% desc)"""
        # 10 metros x S/ 15.20 = S/ 152.00
        # Descuento del 10% = S/ 15.20
        # Valor de venta (Base) = S/ 136.80
        # IGV del 18% = S/ 24.62
        # Total esperado en pantalla = S/ 161.42
        resultado = SistemaTextil.calcular_facturacion(10.0, 15.20, 0.10)
        self.assertEqual(resultado, 161.42)

    def test_02_verificar_alerta_stock(self):
        """PRUEBA 2: ALERTA DE STOCK"""
        # Stock actual: 20 rollos | Stock minimo: 50 rollos
        resultado = SistemaTextil.verificar_alerta_stock(20, 50)
        self.assertEqual(resultado, "ALERTA: Stock crítico")

    def test_03_registrar_despacho(self):
        """PRUEBA 3: REGISTRO DE DESPACHO"""
        # Stock inicial: 500 unidades.
        # Cantidad despachada: 200 unidades.
        # Stock restante esperado: 300 unidades.
        resultado = SistemaTextil.registrar_despacho(500, 200)
        self.assertEqual(resultado, 300)

    def test_04_calcular_rotacion_inventario(self):
        """PRUEBA 4: ROTACION DE INVENTARIO"""
        # Costo de bienes vendidos: S/ 50,000.
        # Inventario promedio: S/ 10,000.
        # Rotacion esperada: 5.0 veces.
        resultado = SistemaTextil.calcular_rotacion_inventario(50000.0, 10000.0)
        self.assertAlmostEqual(resultado, 5.0, places=3)


def imprimir_resumen_visual():
    print("=" * 80)
    print(" ACTIVIDAD: 4 PRUEBAS UNITARIAS (MIGRACION JAVA -> PYTHON)")
    print("=" * 80)

    res1 = SistemaTextil.calcular_facturacion(10.0, 15.20, 0.10)
    res2 = SistemaTextil.verificar_alerta_stock(20, 50)
    res3 = SistemaTextil.registrar_despacho(500, 200)
    res4 = SistemaTextil.calcular_rotacion_inventario(50000.0, 10000.0)

    casos = [
        (
            "1. Ventas: calcular_facturacion",
            "10 m x S/ 15.20 | Desc: 10% (0.10) | IGV: 18%",
            161.42,
            res1,
            "S/ 161.42",
            f"S/ {res1:,.2f}",
        ),
        (
            "2. Inventario: verificar_alerta_stock",
            "Stock actual: 20 rollos | Minimo: 50 rollos",
            "ALERTA: Stock crítico",
            res2,
            "ALERTA: Stock crítico",
            res2,
        ),
        (
            "3. Inventario: registrar_despacho",
            "Stock inicial: 500 | Despachado: 200",
            300,
            res3,
            "300 unidades",
            f"{res3} unidades",
        ),
        (
            "4. Reportes: calcular_rotacion_inventario",
            "Costo vendidos: S/ 50,000 | Inv. promedio: S/ 10,000",
            5.0,
            res4,
            "5.0 veces",
            f"{res4:.1f} veces",
        ),
    ]

    for nombre, entrada, val_esp, val_obt, txt_esp, txt_obt in casos:
        estado = "[APROBADO]" if val_esp == val_obt else "[FALLIDO]"
        print(f"Modulo/Funcion : {nombre}")
        print(f"Entrada        : {entrada}")
        print(f"Esperado       : {txt_esp}")
        print(f"Obtenido       : {txt_obt}")
        print(f"Resultado      : {estado}")
        print("-" * 80)
    import sys
    sys.stdout.flush()


if __name__ == "__main__":
    imprimir_resumen_visual()
    print("\nEjecutando verificacion formal con unittest:")
    import sys
    sys.stdout.flush()
    unittest.main(verbosity=2)
