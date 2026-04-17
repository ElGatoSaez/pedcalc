# pedcalc

Calculadora pediatrica en progreso para apoyar el trabajo clinico diario: dosis, nutricion, ictericia neonatal, APGAR y mas.

## Estado

Proyecto en desarrollo activo. La idea es ir construyendo un set de calculadoras "de bolsillo" (rapidas, claras y con buen contexto clinico) para Pediatria y Neonatologia.

## Que va a incluir

- Calculadora de dosis (peso, via, frecuencia, maximos y alertas basicas)
- Diagnostico nutricional (antropometria y clasificacion)
- Ictericia neonatal (apoyo para interpretacion/seguimiento segun criterios clinicos)
- APGAR (registro y calculo)
- Otras calculadoras pediatrias utiles (por definir)

## Objetivos de diseno

- Rapida: pocos pasos, resultados legibles
- Segura: limites y advertencias cuando corresponda
- Transparente: mostrar como se obtuvo el resultado (y las unidades)
- Portable: facil de correr y desplegar

## Uso

Todavia no hay una version publicada ni una CLI estable. Cuando exista un primer release, este README se va a actualizar con instrucciones de instalacion/ejecucion.

Mientras tanto:

- Issues: usa GitHub Issues para proponer calculadoras y reglas clinicas a implementar
- PRs: bienvenidos (idealmente, una calculadora por PR)

## Contribuir

Si vas a aportar una calculadora nueva, idealmente incluye:

- Inputs esperados (con unidades y rangos)
- Referencia clinica (guia, paper, o estandar) y supuestos
- Casos de prueba (al menos 3: tipico, borde, invalido)
- Texto corto para explicar el resultado a quien lo usa

## Disclaimer (importante)

Esto es una herramienta de apoyo y no reemplaza el juicio clinico. Siempre valida dosis, unidades y criterios con tus fuentes locales y protocolos del centro.

## Roadmap (tentativo)

- Base comun de unidades y conversiones
- Motor de validacion/alertas (rangos, maximos, contraindicaciones simples)
- Primer set de calculadoras con tests
- Publicacion de una version inicial

## Licencia

Pendiente de definir.
