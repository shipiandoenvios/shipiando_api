# API Endpoints (auto-extracted)

Este archivo fue generado automáticamente a partir de los controladores en `src/modules`.
Úsalo como referencia para LLMs, pruebas de contrato y documentación interna. Revísalo y actualízalo si la API cambia.

Fecha: 2025-11-03

Ruta base: `/api` (añadir prefijo en el cliente si aplica)

---

## warehouse
- POST /api/warehouse — CreateWarehouseDto
- GET  /api/warehouse — PaginationQueryDto
- GET  /api/warehouse/:id — (id)
- PATCH /api/warehouse/:id — UpdateWarehouseDto
- DELETE /api/warehouse/:id

## vehicle
- POST /api/vehicle — CreateVehicleDto
- GET  /api/vehicle — PaginationQueryDto
- GET  /api/vehicle/:id
- PATCH /api/vehicle/:id — UpdateVehicleDto
- DELETE /api/vehicle/:id

## user
- POST /api/user — CreateUserDto
- GET  /api/user — PaginationQueryDto
- GET  /api/user/:id
- PATCH /api/user/:id — UpdateUserDto
- DELETE /api/user/:id

## tracking-event
- POST /api/tracking-event — CreateTrackingEventDto
- GET  /api/tracking-event — PaginationQueryDto
- GET  /api/tracking-event/:id
- PATCH /api/tracking-event/:id — UpdateTrackingEventDto
- DELETE /api/tracking-event/:id

## shipment
- POST /api/shipment — CreateShipmentDto
- GET  /api/shipment — PaginationQueryDto
- GET  /api/shipment/:id
- PATCH /api/shipment/:id — UpdateShipmentDto
- DELETE /api/shipment/:id
- PATCH /api/shipment/:id/packages/bulk-update — BulkUpdateShipmentPackagesDto

## role
- POST /api/role — CreateRoleDto
- GET  /api/role — PaginationQueryDto
- GET  /api/role/:id
- PATCH /api/role/:id — UpdateRoleDto
- DELETE /api/role/:id

## product
- POST /api/product — CreateProductDto
- GET  /api/product — PaginationQueryDto
- GET  /api/product/:id
- PATCH /api/product/:id — UpdateProductDto
- DELETE /api/product/:id

## product-category
- POST /api/product-category — CreateProductCategoryDto
- GET  /api/product-category — PaginationQueryDto
- GET  /api/product-category/:id
- PATCH /api/product-category/:id — UpdateProductCategoryDto
- DELETE /api/product-category/:id


## package
- POST /api/package — CreatePackageDto
- GET  /api/package — PaginationQueryDto
- GET  /api/package/tracking/:trackingCode — (trackingCode, optional query viewerType)
- GET  /api/package/:id — (id)
- GET  /api/package/:id/context — (id, optional query viewerType)
  
	Example request (POST /api/package):
	```json
	{
		"orderId": "ORD-001",
		"trackingCode": "PKG-001",
		"weightKg": 2.5,
		"heightCm": 10,
		"lengthCm": 20,
		"widthCm": 15,
		"originId": "addr-1",
		"destinationId": "addr-2",
		"status": "CREATED"
	}
	```

	Example response (POST /api/package):
	```json
	{
		"id": "pkg-id",
		"trackingCode": "PKG-001",
		"status": "CREATED",
		"weightKg": 2.5,
		"createdAt": "2025-11-01T10:00:00.000Z"
	}
	```

	Example request (PATCH /api/package/:id/scan):
	```json
	{
		"status": "IN_TRANSIT",
		"latitude": -34.6037,
		"longitude": -58.3816,
		"currentWarehouseId": "war-1",
		"viewerType": "WAREHOUSE"
	}
	```

	Example response (PATCH /api/package/:id/scan):
	```json
	{
		"id": "pkg-id",
		"status": "IN_TRANSIT",
		"lastScanAt": "2025-11-05T12:00:00.000Z"
	}
	```
- PATCH /api/package/:id — UpdatePackageDto
	- Usar para actualizar estado del paquete, incluyendo cancelación (`status: 'CANCELLED'`).
	- Solo el creador puede cancelar si el paquete no ha salido de la warehouse de origen.
	- Requiere autenticación y roles válidos (ADMIN, WAREHOUSE, CARRIER, STORE; para cancelar, solo el creador y bajo condiciones de negocio).
- PATCH /api/package/:id/scan — ScanPackageDto (+ viewerType) (body: status?, latitude?, longitude?, currentWarehouseId?, viewerType?)
- DELETE /api/package/:id

## order
- POST /api/order — CreateOrderDto
- GET  /api/order — PaginationQueryDto
- GET  /api/order/:id
- PATCH /api/order/:id — UpdateOrderDto
- DELETE /api/order/:id

## invoice
- POST /api/invoice — CreateInvoiceDto
- GET  /api/invoice — PaginationQueryDto
- GET  /api/invoice/:id
- PATCH /api/invoice/:id — UpdateInvoiceDto
- DELETE /api/invoice/:id

## inventory
- POST /api/inventory — CreateInventoryDto
- GET  /api/inventory — PaginationQueryDto
- GET  /api/inventory/:id
- PATCH /api/inventory/:id — UpdateInventoryDto
- DELETE /api/inventory/:id

## client-user
- POST /api/client-user — CreateClientUserDto
- GET  /api/client-user/by-client/:clientId — PaginationQueryDto
- GET  /api/client-user/by-user/:userId — PaginationQueryDto
- PATCH /api/client-user/:id — UpdateClientUserDto
- DELETE /api/client-user/:id

## client
- POST /api/client — CreateClientDto
- GET  /api/client — PaginationQueryDto
- GET  /api/client/:id
- PATCH /api/client/:id — UpdateClientDto
- DELETE /api/client/:id

## carrier
- POST /api/carrier — CreateCarrierDto
- GET  /api/carrier — PaginationQueryDto
- GET  /api/carrier/:id
- PATCH /api/carrier/:id — UpdateCarrierDto
- DELETE /api/carrier/:id

## address
- POST /api/address — CreateAddressDto
- GET  /api/address — PaginationQueryDto
- GET  /api/address/:id
- PATCH /api/address/:id — UpdateAddressDto
- DELETE /api/address/:id

---

Notas:
- Los DTOs indicados son los que aparecen en cada controlador. Para campos concretos consultar `src/modules/<module>/dto`.
- Algunos endpoints aceptan query params (ej. `viewerType` en package). Ver controladores para detalles.
- Este archivo es una referencia rápida para LLMs; para documentación pública o OpenAPI generar/validar el swagger del backend.
