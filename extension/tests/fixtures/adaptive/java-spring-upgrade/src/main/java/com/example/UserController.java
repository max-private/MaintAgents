package com.example;

import javax.persistence.Entity;          // Spring Boot 2.x — javax namespace
import javax.persistence.Id;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    @GetMapping("/{id}")
    public String getUser(@PathVariable Long id) {
        return "user-" + id;
    }
}

@Entity
class User {
    @Id
    private Long id;
    private String name;
}
