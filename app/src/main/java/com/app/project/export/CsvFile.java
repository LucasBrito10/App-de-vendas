package com.app.project.export;

public class CsvFile {
    private final String fileName;
    private final byte[] content;

    public CsvFile(String fileName, byte[] content) {
        this.fileName = fileName;
        this.content = content;
    }

    public String getFileName() {
        return fileName;
    }

    public byte[] getContent() {
        return content;
    }
}
