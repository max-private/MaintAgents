# Bug Report — Ticket #9821 / #9822

## Summary
NullPointerException in production when placing an order with an expired session cart.

## Environment
- Production (AWS ECS, JDK 17.0.9, Spring Boot 3.2.1)
- Not reproducible in dev (sessions never expire in dev config)

## Stack trace
```
java.lang.NullPointerException: Cannot invoke "com.example.Cart.getItems()" because "cart" is null
    at com.example.OrderService.calculateTotal(OrderService.java:52)
    at com.example.OrderService.processOrder(OrderService.java:34)
    at com.example.OrderController.placeOrder(OrderController.java:78)
```

## Frequency
- 2 occurrences on 2024-03-15 within 4 minutes
- Log search: 47 occurrences in last 30 days (sessions expire after 30 min inactivity)

## Expected behaviour
Order placement with an expired cart should return HTTP 422 with a user-friendly error, not HTTP 500.

## Defect class
Null dereference — CartRepository.findBySession() returns null for expired sessions with no guard upstream.
