package org.bootforce.aipoweredcareermentor.repository;

import org.bootforce.aipoweredcareermentor.model.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {

    List<Article> findByCategoryIgnoreCase(String category);

    List<Article> findByIsTrendingTrueOrderByCreatedAtDesc();

    List<Article> findByStatusOrderByCredibilityScoreDesc(String status);

    Article findBySourceUrl(String sourceUrl);

    boolean existsBySourceUrl(String sourceUrl);

    org.springframework.data.domain.Page<Article> findBySubmittedBy(org.bootforce.aipoweredcareermentor.model.Profile profile, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Article> findBySubmittedByIsNull(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Article a WHERE a.submittedBy IS NULL OR a.submittedBy = :profile")
    org.springframework.data.domain.Page<Article> findPublicAndUserArticles(@org.springframework.data.repository.query.Param("profile") org.bootforce.aipoweredcareermentor.model.Profile profile, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Article a WHERE (a.submittedBy IS NULL OR a.submittedBy = :profile) AND LOWER(a.category) = LOWER(:category)")
    List<Article> findPublicAndUserArticlesByCategory(@org.springframework.data.repository.query.Param("category") String category, @org.springframework.data.repository.query.Param("profile") org.bootforce.aipoweredcareermentor.model.Profile profile);

    List<Article> findByCategoryIgnoreCaseAndSubmittedByIsNull(String category);
}
