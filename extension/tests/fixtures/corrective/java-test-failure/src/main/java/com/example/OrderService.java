package com.example;

import java.util.List;

/** Buggy implementation — items field never initialised */
public class OrderService {

    private List<Double> items;   // BUG: null, never assigned

    public void addItem(String name, double price) {
        items.add(price);          // NullPointerException
    }

    public double total() {
        if (items == null) return 0.0;
        return items.stream().mapToDouble(Double::doubleValue).sum();
    }
}
