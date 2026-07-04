# Claude Code Rules

## Objetivo

Desarrollar un MVP funcional para una demostración universitaria en menos de un día.

La prioridad es terminar un producto completo y presentable.

No sobreingenierizar.

---

# Principios

Priorizar simplicidad.

Priorizar legibilidad.

Priorizar velocidad de desarrollo.

Reutilizar componentes.

Evitar complejidad innecesaria.

---

# Arquitectura

Frontend

React + Vite + TypeScript

Backend

FastAPI

Base de datos

PostgreSQL (Supabase)

Modelo IA

XGBoost existente.

Nunca cambiar estas tecnologías.

---

# Desarrollo

Implementar únicamente funcionalidades necesarias para la demostración.

No agregar características que no aporten valor a la presentación.

Si existen varias soluciones, elegir siempre la más simple.

---

# Código

Seguir KISS.

Seguir DRY.

Una responsabilidad por archivo.

Una responsabilidad por componente.

No duplicar código.

No crear abstracciones innecesarias.

No crear capas adicionales.

---

# Frontend

Usar componentes reutilizables.

Mantener consistencia visual.

No crear componentes mayores de 200 líneas.

No colocar lógica de negocio en React.

Toda la comunicación debe realizarse mediante Axios.

Usar shadcn/ui siempre que sea posible.

Mantener una UX clara y limpia.

---

# Backend

Toda la lógica vive en services.

Routers únicamente reciben peticiones y responden.

No escribir SQL dentro de routers.

Usar Pydantic para validar entradas.

Responder siempre JSON consistente.

---

# Modelo IA

El modelo ya existe.

Nunca modificar entrenamiento.

Nunca crear otro modelo.

Nunca cambiar variables.

Nunca cambiar encoders.

Nunca ejecutar entrenamiento desde FastAPI.

El backend únicamente realiza inferencias.

---

# Base de datos

Usar PostgreSQL.

No crear tablas innecesarias.

No implementar procesos ETL.

No implementar Data Warehouse real.

El Data Warehouse solo forma parte de la explicación académica.

---

# UX

La aplicación debe parecer un sistema empresarial.

Evitar pantallas vacías.

Mostrar estados de carga.

Mostrar mensajes de error claros.

Mostrar mensajes de éxito.

Mantener navegación intuitiva.

Máximo tres clics para cualquier acción.

---

# Diseño

Tema claro.

Colores principales

- Azul
- Blanco
- Gris

Rojo solo para alertas.

Verde solo para éxito.

Espaciado uniforme.

Diseño profesional.

---

# Rendimiento

No optimizar prematuramente.

No agregar cachés.

No agregar colas.

No agregar WebSockets.

No agregar microservicios.

La aplicación tendrá pocos usuarios simultáneos.

---

# Librerías

Preferir librerías ampliamente utilizadas.

No agregar dependencias innecesarias.

Antes de instalar una librería nueva verificar si ya existe una solución en el proyecto.

---

# Errores

Nunca ocultar errores silenciosamente.

Mostrar mensajes comprensibles.

Registrar errores únicamente cuando sea necesario.

---

# Antes de generar código

Claude debe verificar:

- ¿Ya existe un componente similar?
- ¿Puede reutilizar código existente?
- ¿La solución es la más simple?
- ¿Respeta la estructura del proyecto?
- ¿Es necesaria esta dependencia?
- ¿Es realmente necesaria esta funcionalidad?

Si alguna respuesta es NO, replantear la implementación.

---

# Objetivo final

Construir una aplicación limpia, consistente y completamente funcional para la presentación del curso.

La prioridad es una excelente experiencia de usuario y una demostración estable, no una arquitectura enterprise.

---

# Orden de implementación

Implementar siempre en este orden.

1. Layout general
2. Navegación
3. Dashboard
4. Gestión de clientes
5. Predicción IA
6. Reportes
7. Chat IA
8. Ajustes visuales
9. Deploy

No avanzar al siguiente módulo sin terminar el anterior.

Cada módulo debe quedar completamente funcional antes de continuar.

---

# Criterios de aceptación

Cada módulo debe cumplir:

- Compila sin errores.
- No rompe otros módulos.
- Responsive.
- Código legible.
- Componentes reutilizables.
- Sin código duplicado.
- Interfaz profesional.
