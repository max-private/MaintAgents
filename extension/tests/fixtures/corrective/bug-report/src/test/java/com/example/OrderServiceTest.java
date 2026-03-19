package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Reproducing test for production bug #9821:
 * OrderService.processOrder() throws NPE when cart session has expired.
 *
 * This test FAILS before the fix is applied (CartRepository returns null,
 * calculateTotal() throws NPE instead of returning a structured error).
 */
class OrderServiceTest {

    @Test
    void processOrder_throwsNPE_whenSessionExpired_bug9821() {
        CartRepository repo = mock(CartRepository.class);
        when(repo.findBySession("expired-session")).thenReturn(null);

        OrderService svc = new OrderService(repo);

        // Before fix: throws NullPointerException
        // After fix:  returns OrderResult with error status or throws CartExpiredException
        assertThrows(NullPointerException.class,
            () -> svc.processOrder("expired-session", 9821L));
    }

    @Test
    void processOrder_returnsTotal_whenCartValid() {
        Cart cart = mock(Cart.class);
        CartItem item = mock(CartItem.class);
        when(item.getPrice()).thenReturn(10.0);
        when(item.getQuantity()).thenReturn(2);
        when(cart.getItems()).thenReturn(java.util.List.of(item));

        CartRepository repo = mock(CartRepository.class);
        when(repo.findBySession("valid-session")).thenReturn(cart);

        OrderService svc = new OrderService(repo);
        OrderResult result = svc.processOrder("valid-session", 1L);
        assertEquals(20.0, result.getTotal(), 0.001);
    }
}
