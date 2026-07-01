# Search System Architecture

The Search System in FileFlow acts as a decoupled aggregation and retrieval layer, combining file records and transaction state from the File, Share, and Smart Collection domains.

```
                  ┌──────────────────┐
                  │ SearchController │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │  SearchService   │
                  └────┬───┬───┬─────┘
                       │   │   │
        ┌──────────────┘   │   └──────────────┐
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│FileRepository│   │ShareRepositor│   │CollectionServ│
└──────────────┘   └──────────────┘   └──────────────┘
```

## String Matching & Relevance Score

When searching files, filenames are evaluated with a custom matching algorithm scoring match weight:
1. **Exact Matches (Weight: 1000)**: Assigned when the filename matches the query string exactly.
2. **Prefix Matches (Weight: 500+)**: Assigned when the filename starts with the query. Short filenames are penalized less (higher query density) using the formula:
   $$\text{Score} = 500 + \frac{100}{\text{filename.length} - \text{query.length} + 1}$$
3. **Infix / Suffix Matches (Weight: 100+)**: Matches query substrings within the filename body. Higher positioning (closer to index 0) and shorter files receive scoring priority:
   $$\text{Score} = 100 + \frac{50}{\text{matchIndex} + 1} + \frac{50}{\text{filename.length} - \text{query.length} + 1}$$

If the search query is empty, sorting defaults back to the file creation timestamp (`createdAt`).

## Advanced Sort Metrics

- **Most Shared**: Counts total associated active shares from the `InMemoryShareRepository` for a given file.
- **Most Downloaded**: Sums download counts of active shares associated with a given file.
- **Recently Modified**: Retrieves sorting by `updatedAt` field.
- **Relevance**: Evaluates matched query scores computed dynamically on the fly.

## Smart Collection Search Delegation

When searching files within a collection (using the `collectionType` filter parameter), `SearchService` delegates file filtering to `CollectionService`. This maintains consistency in classification business rules (such as matching security risk thresholds in `Needs Attention` or byte size barriers in `Large Files`).
