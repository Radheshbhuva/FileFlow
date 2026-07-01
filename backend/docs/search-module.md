# Search & Discovery Module

The **Search & Discovery Module** serves as the central navigation, filtering, and workspace command center for FileFlow. It allows users to quickly search, filter, and discover their files using advanced metadata parameters and search suggestion heuristics.

## Key Features

1. **Global Search (`/api/v1/search`)**: A unified search route matching files and virtual collection types matching a given query.
2. **File Search (`/api/v1/search/files`)**: A robust search interface providing advanced multi-dimensional filtering, custom string relevance ordering, and paginated outputs.
3. **Search Suggestions (`/api/v1/search/suggestions`)**: Provides history lists, global popular search keywords, and fuzzy matching suggestions.
4. **Recent Searches (`/api/v1/search/recent`)**: Tracks search queries by user to output recent query strings.
5. **Discovery Feed (`/api/v1/search/discover`)**: Groups files into dynamic workspace blocks like recently modified, favorites, large files, files needing attention, and highly accessed items.
6. **Trending Feed (`/api/v1/search/trending`)**: Categorizes top active files based on downloads, share count, and favorite state.

## Core Components

- **`search.interface.ts`**: Defines strict TypeScript interfaces for filter parameters, query options, vector searching, and indexing.
- **`InMemorySearchHistoryRepository`**: Singleton class logging search query text, frequency counts, and tracking failed queries.
- **`SearchService`**: Houses the main relevance calculations, advanced query filtering and sorting, and delegates to the `CollectionService` to prevent code duplication.
- **`SearchController`**: Exposes Express routing handlers returning normalized envelopes.
- **`SearchValidators`**: Uses Zod to validate and coerce query parameters.
