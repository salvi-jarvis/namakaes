# NEXO audit corrections

- [x] Confirm actual routes and audit targets: six content routes; MCP route, sync module and CloudSection are absent.
- [x] Prevent Classroom pagination from silently returning incomplete results and surface loading failures.
- [x] Add and run regression tests (13 passed), run available lint (574 errors and 7 warnings remain), and inspect automatic build results (latest: build OK). Restore the missing dependency used by generated Cloud clients.
- [x] Verify the Classroom error/import flow with simulated Google responses in the browser; no browser errors. Real Google OAuth/API and absent MCP/sync implementations remain unverified. No publishing or production changes.
# Versión final
- [x] Calendario de exámenes mensual local con CRUD, filtros y persistencia.
- [ ] Google Calendar: bloqueado — requiere cuentas de usuario y conexión de Google por usuario.

# Evolución integral solicitada
- [ ] Tarea acotada autorizada: renombrado visible y PWA; preservar archivos protegidos y contenido exacto compatible. No publicar.
- [ ] Usar Nā Maka como nuevo nombre; cambios visibles pendientes de autorización tras la auditoría.
- [ ] Entregar auditoría de credenciales e integraciones sin cambios de aplicación; esperar configuración y autorización antes de implementar.
- [ ] Auditar estado actual, soporte PWA y requisitos de ChatGPT Apps SDK/MCP; definir fases compatibles.
- [ ] Conectar Inicio, tareas, exámenes y planificación determinista con propuestas editables.
- [ ] Añadir progreso académico y herramientas locales de concentración, tarjetas y práctica.
- [ ] Reforzar persistencia, importación, errores y consentimiento para compartir con ChatGPT.
- [ ] Añadir PWA y verificar comportamiento móvil, caché y actualizaciones sin pérdida de datos.
- [ ] Ejecutar pruebas y verificaciones; documentar resultados y límites externos sin publicar.
