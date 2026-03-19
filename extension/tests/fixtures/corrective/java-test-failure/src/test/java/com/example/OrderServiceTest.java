package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/** Failing test fixture — NullPointerException in processOrder when item list is null */
class OrderServiceTest {

    @Test
    void processOrder_withValidItems_returnsTotal() {
        OrderService svc = new OrderService();
        // BUG: constructor does not initialise items list — NPE on add()
        svc.addItem("Widget", 9.99);
        assertEquals(9.99, svc.total(), 0.001);
    }

    @Test
    void processOrder_withEmptyCart_returnsZero() {
        OrderService svc = new OrderService();
        assertEquals(0.0, svc.total(), 0.001);
    }
}
