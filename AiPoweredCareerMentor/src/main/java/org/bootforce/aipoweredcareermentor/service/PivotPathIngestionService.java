package org.bootforce.aipoweredcareermentor.service;

import org.springframework.ai.document.Document;
import org.springframework.ai.reader.JsonReader;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PivotPathIngestionService {

    private final VectorStore vectorStore;
    private final ResourceLoader resourceLoader;

    public void ingestPdf(Resource pdfResource, String category) {
        log.info("Starting ingestion for PDF resource: {}", pdfResource.getFilename());
        PagePdfDocumentReader reader = new PagePdfDocumentReader(pdfResource,
                PdfDocumentReaderConfig.builder()
                        .withPageTopMargin(0)
                        .withPageBottomMargin(0)
                        .build());

        List<Document> documents = reader.get();

        TokenTextSplitter splitter = new TokenTextSplitter();
        List<Document> chunks = splitter.apply(documents);

        chunks.forEach(doc -> {
            doc.getMetadata().put("category", category);
            doc.getMetadata().put("source", pdfResource.getFilename());
        });

        vectorStore.accept(chunks);
        log.info("Successfully ingested {} chunks for {}", chunks.size(), pdfResource.getFilename());
    }

    public void ingestLocalCourseCatalog(Resource jsonResource) {
        try {
            log.info("Ingesting local course catalog from: {}", jsonResource.getFilename());
            JsonReader jsonReader = new JsonReader(jsonResource, "title", "description", "url", "provider");
            List<Document> documents = jsonReader.get();

            documents.forEach(doc -> {
                doc.getMetadata().put("category", "COURSE");
            });

            vectorStore.accept(documents);
            log.info("Courses ingested with URL Metadata!");
        } catch (Exception e) {
            log.error("Failed to ingest local catalog", e);
            throw new RuntimeException("Failed to ingest local catalog", e);
        }
    }
}
