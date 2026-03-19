package com.example;

/** High cognitive complexity — SonarQube S3776 violation */
public class ReportGenerator {

    public String generate(String type, boolean draft, boolean urgent, String format) {
        String result = "";
        if (type != null) {
            if (type.equals("invoice")) {
                if (draft) {
                    if (urgent) {
                        result = "URGENT-DRAFT-INV";
                    } else {
                        result = "DRAFT-INV";
                    }
                } else {
                    if (format != null) {
                        if (format.equals("pdf")) {
                            result = "INV-PDF";
                        } else if (format.equals("csv")) {
                            result = "INV-CSV";
                        } else {
                            result = "INV-OTHER";
                        }
                    } else {
                        result = "INV";
                    }
                }
            } else if (type.equals("receipt")) {
                if (urgent) {
                    result = "URGENT-RECEIPT";
                } else {
                    result = "RECEIPT";
                }
            }
        }
        return result;
    }
}
