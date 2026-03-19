package com.example;

import java.util.List;

/**
 * BUG: calculateTotal() throws NPE when CartRepository.findBySession()
 * returns null for expired sessions. Root cause: no null guard after lookup.
 * Reported: production ticket #9821, #9822 — 2024-03-15 14:32 UTC
 */
public class OrderService {

    private final CartRepository cartRepository;

    public OrderService(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    public OrderResult processOrder(String sessionId, long orderId) {
        Cart cart = cartRepository.findBySession(sessionId);
        double total = calculateTotal(cart);   // line 34 — NPE if cart is null
        return new OrderResult(orderId, total);
    }

    public double calculateTotal(Cart cart) {
        // line 52 — NPE: cart is null for expired sessions
        List<CartItem> items = cart.getItems();
        return items.stream()
                    .mapToDouble(i -> i.getPrice() * i.getQuantity())
                    .sum();
    }
}
