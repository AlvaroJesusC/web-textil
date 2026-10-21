"""
================================================================================
ACTIVIDAD ACADÉMICA: PRUEBAS UNITARIAS EN PYTHON
Curso: Calidad de Software (UCV 2026)
Módulo Evaluado: VENTAS Y FACTURACIÓN (Sistema Textilería)

4 funciones esenciales + 4 pruebas unitarias para verificar resultados esperados.
Ejecución directa:
    python ejemplo_pruebas_unitarias.py
================================================================================
"""

import unittest


# ==============================================================================
# LAS 4 FUNCIONES DEL MÓDULO DE VENTAS (CORTAS Y DIRECTAS)
# ==============================================================================

def calcular_subtotal(cantidad: int, precio_unitario: float) -> float:
    """1. Multiplica la cantidad por el precio unitario del producto textil."""
    if cantidad <= 0 or precio_unitario <= 0:
        raise ValueError("Cantidad y precio deben ser mayores a 0.")
    return round(cantidad * precio_unitario, 2)


def calcular_descuento(subtotal: float, porcentaje: float) -> float:
    """2. Calcula el monto en soles a descontar según el porcentaje (0% a 100%)."""
    if porcentaje < 0 or porcentaje > 100:
        raise ValueError("El porcentaje de descuento debe estar entre 0 y 100.")
    return round(subtotal * (porcentaje / 100), 2)


def calcular_igv(base_imponible: float) -> float:
    """3. Calcula el 18% del Impuesto General a las Ventas (IGV en Perú)."""
    if base_imponible < 0:
        raise ValueError("La base imponible no puede ser negativa.")
    return round(base_imponible * 0.18, 2)


def calcular_total_venta(cantidad: int, precio: float, porcentaje_descuento: float = 0.0) -> dict:
    """4. Integra el cálculo total: Subtotal - Descuento + IGV (18%)."""
    subtotal = calcular_subtotal(cantidad, precio)
    descuento = calcular_descuento(subtotal, porcentaje_descuento)
    base = round(subtotal - descuento, 2)
    igv = calcular_igv(base)
    total = round(base + igv, 2)
    return {
        "subtotal": subtotal,
        "descuento": descuento,
        "base_imponible": base,
        "igv": igv,
        "total": total,
    }


# ==============================================================================
# LAS 4 PRUEBAS UNITARIAS (Verificación de Funcionalidad y Resultados Esperados)
# ==============================================================================

class TestModuloVentas(unittest.TestCase):

    def test_01_calcular_subtotal(self):
        """Prueba 1: 3 metros de tela a S/ 25.50 c/u debe dar S/ 76.50."""
        # Datos de entrada
        cantidad = 3
        precio = 25.50
        # Resultado esperado: 3 * 25.50 = 76.50
        resultado_esperado = 76.50
        resultado_obtenido = calcular_subtotal(cantidad, precio)
        self.assertEqual(resultado_obtenido, resultado_esperado)

    def test_02_calcular_descuento(self):
        """Prueba 2: Descuento del 10% sobre un subtotal de S/ 200.00 debe ser S/ 20.00."""
        subtotal = 200.00
        porcentaje = 10.0
        # Resultado esperado: 200.00 * (10 / 100) = 20.00
        resultado_esperado = 20.00
        resultado_obtenido = calcular_descuento(subtotal, porcentaje)
        self.assertEqual(resultado_obtenido, resultado_esperado)

    def test_03_calcular_igv(self):
        """Prueba 3: IGV (18%) sobre una base imponible de S/ 100.00 debe ser S/ 18.00."""
        base = 100.00
        # Resultado esperado: 100.00 * 0.18 = 18.00
        resultado_esperado = 18.00
        resultado_obtenido = calcular_igv(base)
        self.assertEqual(resultado_obtenido, resultado_esperado)

    def test_04_calcular_total_venta(self):
        """Prueba 4: Venta de 2 rollos a S/ 50.00 con 10% descuento debe totalizar S/ 106.20."""
        # Entrada: 2 rollos * S/ 50 = S/ 100 subtotal, -10 desc = S/ 90 base + 16.20 IGV = 106.20
        resumen = calcular_total_venta(cantidad=2, precio=50.00, porcentaje_descuento=10.0)
        
        self.assertEqual(resumen["subtotal"], 100.00)
        self.assertEqual(resumen["descuento"], 10.00)
        self.assertEqual(resumen["base_imponible"], 90.00)
        self.assertEqual(resumen["igv"], 16.20)
        self.assertEqual(resumen["total"], 106.20)


# ==============================================================================
# REPORTE VISUAL EN CONSOLA (Entrada vs Resultado Esperado vs Resultado Obtenido)
# ==============================================================================

def imprimir_resumen_visual():
    print("=" * 75)
    print(" ACTIVIDAD: 4 PRUEBAS UNITARIAS - MODULO DE VENTAS (TEXTILERIA)")
    print("=" * 75)

    casos = [
        (
            "1. calcular_subtotal",
            "Cantidad: 3 | Precio: S/ 25.50",
            76.50,
            calcular_subtotal(3, 25.50),
        ),
        (
            "2. calcular_descuento",
            "Subtotal: S/ 200.00 | Descuento: 10%",
            20.00,
            calcular_descuento(200.00, 10.0),
        ),
        (
            "3. calcular_igv",
            "Base Imponible: S/ 100.00 (Tasa 18%)",
            18.00,
            calcular_igv(100.00),
        ),
        (
            "4. calcular_total_venta",
            "Cant: 2 | Precio: S/ 50.00 | Desc: 10%",
            106.20,
            calcular_total_venta(2, 50.00, 10.0)["total"],
        ),
    ]

    for nombre, entrada, esperado, obtenido in casos:
        estado = "[APROBADO]" if esperado == obtenido else "[FALLIDO]"
        print(f"Funcion   : {nombre}")
        print(f"Entrada   : {entrada}")
        print(f"Esperado  : {esperado}")
        print(f"Obtenido  : {obtenido}")
        print(f"Resultado : {estado}")
        print("-" * 75)
    import sys
    sys.stdout.flush()


if __name__ == "__main__":
    imprimir_resumen_visual()
    print("\nEjecutando verificacion formal con unittest:")
    import sys
    sys.stdout.flush()
    unittest.main(verbosity=2)
