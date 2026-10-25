# Prueba de conectividad SITPORT

Este repositorio contiene únicamente un diagnóstico de las ocho fuentes públicas de SITPORT. No contiene credenciales, datos privados ni una copia de la aplicación Entre Canales.

## Resultado: 25 de octubre de 2026

Se ejecutaron dos pruebas con ejecutores estándar de GitHub Actions, tanto Linux como Windows:

- Primera ejecución: 0 de 8 fuentes accesibles en ambos sistemas.
- Segunda ejecución: 0 de 8 fuentes accesibles en ambos sistemas.
- DNS correcto para los dominios de SITPORT.
- HTTPS de control hacia github.com: HTTP 200.
- HTTPS con IPv4 y cliente independiente de fetch hacia ambos dominios SITPORT: timeout de 15 segundos.
- En una comprobación contemporánea desde el PC del propietario, las ocho fuentes respondieron HTTP 200.

Las pruebas utilizaron conexiones de Azure en eastus, westus3, northcentralus y westcentralus. Esto demuestra falta de conectividad desde esos ejecutores; no permite atribuir la causa exacta a una política geográfica o a un bloqueo específico.

[Primera ejecución](https://github.com/Felipe-Infante-L/sitport-collector/actions/runs/40199833645) · [Diagnóstico adicional](https://github.com/Felipe-Infante-L/sitport-collector/actions/runs/40199960295)

## Estado

No se activó una programación recurrente ni se conectó este repositorio con la base de datos. El recolector existente permanece activo por separado.

El workflow se ejecuta manualmente o al modificar su código de diagnóstico. Registra únicamente estados HTTP, conteos, tamaños y errores de conexión; no publica los cuerpos de las respuestas.
