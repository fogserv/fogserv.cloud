# AI/ML - Local LLMs, Vector Databases & RAG

**Status**: Active  
**Last Updated**: 2026-01-30  
**Category**: Artificial Intelligence & Machine Learning  
**Prerequisites**: [kb/basics/](../basics/), [kb/containers/docker-basics](../containers/docker-basics)  
**Tags**: ai, ml, llm, ollama, vector-db, rag, embeddings, fine-tuning, self-hosted

## Summary

Run your own AI infrastructure with local LLMs (Ollama), vector databases (Qdrant/Milvus), and Retrieval Augmented Generation (RAG) systems. From simple chatbot to production AI applications, fully self-hosted and private.

## 🎯 Learning Philosophy

**AI on Your Hardware**:
```
Cloud AI APIs → Local LLMs → Your Data Stays Home
(Pay per token) (Free, private) (Full control)
```

This directory teaches AI/ML assuming **no AI background** but strong interest in running models locally. Progressive implementation from simple LLM inference through production RAG systems.

## 📚 Learning Path

```
Prerequisites: Docker basics, Python fundamentals
         ↓
┌────────────────────────────────────────┐
│  PHASE 1: LLM Fundamentals             │
│  ├─ What are LLMs                      │
│  ├─ Models vs APIs                     │
│  ├─ Ollama setup (local LLMs)          │
│  ├─ Running your first model           │
│  └─ Model selection guide              │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 2: LLM Integration              │
│  ├─ OpenAI-compatible API              │
│  ├─ Python SDK usage                   │
│  ├─ Prompt engineering basics          │
│  ├─ Context windows and tokens         │
│  └─ Streaming responses                │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 3: Vector Databases             │
│  ├─ Embeddings explained               │
│  ├─ Vector similarity search           │
│  ├─ Qdrant setup                       │
│  ├─ Storing and querying vectors       │
│  └─ Semantic search                    │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 4: RAG Systems                  │
│  ├─ What is RAG                        │
│  ├─ Document chunking                  │
│  ├─ Building RAG pipeline              │
│  ├─ LangChain integration              │
│  └─ Production RAG patterns            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  PHASE 5: Advanced & Fine-tuning       │
│  ├─ Model quantization                 │
│  ├─ Fine-tuning basics                 │
│  ├─ Multi-modal models                 │
│  ├─ Agent frameworks                   │
│  └─ GPU optimization                   │
└────────────────────────────────────────┘
```

## 📖 Articles in This Directory

### 🟢 Phase 1: LLM Fundamentals (Start Here)

**Understanding Large Language Models**:
1. **[llm-introduction](llm-introduction)** - What are LLMs
   - How LLMs work (simplified)
   - Transformers architecture
   - Parameters and model sizes
   - Cloud vs local LLMs
   - Privacy considerations
   - **Prerequisites**: None
   - **Time**: 2 hours
   - **Resources**: `[██░░░░░░░░]` 20% - Conceptual

2. **[ollama-setup](ollama-setup)** - Run LLMs locally
   - Ollama installation
   - GPU vs CPU inference
   - Downloading models
   - First inference
   - Model management
   - **Prerequisites**: Docker basics
   - **Time**: 1-2 hours
   - **Resources**: `[██████░░░░]` 60% - 8GB+ RAM, GPU optional

3. **[model-selection-guide](model-selection-guide)** - Choosing the right model
   - Llama 3, Mistral, Phi-3
   - Model size trade-offs
   - Speed vs quality
   - Hardware requirements
   - Task-specific models
   - **Prerequisites**: Ollama running
   - **Time**: 2 hours
   - **Resources**: `[███░░░░░░░]` 30%

4. **[ollama-cli-basics](ollama-cli-basics)** - Command-line usage
   - ollama run
   - ollama list, pull, rm
   - Prompt from stdin
   - Model parameters
   - System prompts
   - **Prerequisites**: Ollama installed
   - **Time**: 1-2 hours
   - **Resources**: `[███░░░░░░░]` 30%

### 🟡 Phase 2: LLM Integration (Build Applications)

5. **[ollama-api](ollama-api)** - OpenAI-compatible API
   - REST API overview
   - /api/generate endpoint
   - /api/chat endpoint
   - Streaming responses
   - API authentication
   - **Prerequisites**: Ollama basics, HTTP
   - **Time**: 2-3 hours
   - **Resources**: `[████░░░░░░]` 40%

6. **[python-llm-integration](python-llm-integration)** - Python SDK
   - Ollama Python library
   - Basic chat implementation
   - Conversation memory
   - Error handling
   - Async usage
   - **Prerequisites**: Python basics
   - **Time**: 3-4 hours
   - **Resources**: `[█████░░░░░]` 50%

7. **[prompt-engineering](prompt-engineering)** - Crafting effective prompts
   - Prompt structure
   - System prompts
   - Few-shot learning
   - Chain-of-thought
   - Prompt templates
   - **Prerequisites**: LLM experience
   - **Time**: 3-4 hours
   - **Resources**: `[████░░░░░░]` 40%

8. **[context-and-tokens](context-and-tokens)** - Understanding limits
   - Token counting
   - Context window sizes
   - Truncation strategies
   - Sliding windows
   - Memory management
   - **Prerequisites**: LLM integration
   - **Time**: 2-3 hours
   - **Resources**: `[████░░░░░░]` 40%

9. **[llm-streaming](llm-streaming)** - Real-time responses
   - SSE (Server-Sent Events)
   - Streaming with Python
   - WebSocket integration
   - Frontend display
   - **Prerequisites**: Web basics
   - **Time**: 2-3 hours
   - **Resources**: `[█████░░░░░]` 50%

### 🟠 Phase 3: Vector Databases (Semantic Search)

10. **[embeddings-explained](embeddings-explained)** - Vector representations
    - What are embeddings
    - Sentence transformers
    - Semantic similarity
    - Dimensionality
    - Embedding models
    - **Prerequisites**: LLM basics
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

11. **[qdrant-setup](qdrant-setup)** - Vector database
    - Qdrant installation (Docker)
    - Collections and vectors
    - Distance metrics
    - Filtering
    - Web UI
    - **Prerequisites**: Docker basics
    - **Time**: 2-3 hours
    - **Resources**: `[█████░░░░░]` 50% - 2GB RAM

12. **[vector-storage-operations](vector-storage-operations)** - CRUD operations
    - Inserting vectors
    - Similarity search
    - Payload filtering
    - Batch operations
    - Python SDK usage
    - **Prerequisites**: Qdrant running
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

13. **[semantic-search-basics](semantic-search-basics)** - Finding similar content
    - Generating embeddings
    - Indexing documents
    - Search queries
    - Ranking results
    - Hybrid search
    - **Prerequisites**: Vector database
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

14. **[vector-db-alternatives](vector-db-alternatives)** - Other options
    - Milvus
    - Weaviate
    - ChromaDB
    - Pgvector (Postgres)
    - Comparison matrix
    - **Prerequisites**: Vector concepts
    - **Time**: 2 hours
    - **Resources**: `[████░░░░░░]` 40%

### 🔴 Phase 4: RAG Systems (Production AI)

15. **[rag-introduction](rag-introduction)** - Retrieval Augmented Generation
    - What is RAG
    - Why RAG vs fine-tuning
    - RAG architecture
    - Use cases
    - Benefits and limitations
    - **Prerequisites**: LLM + vectors
    - **Time**: 2 hours
    - **Resources**: `[███░░░░░░░]` 30%

16. **[document-chunking](document-chunking)** - Splitting documents
    - Chunking strategies
    - Chunk size optimization
    - Overlap considerations
    - Metadata extraction
    - Document loaders
    - **Prerequisites**: RAG concepts
    - **Time**: 2-3 hours
    - **Resources**: `[████░░░░░░]` 40%

17. **[rag-pipeline-basics](rag-pipeline-basics)** - Building RAG
    - Ingestion pipeline
    - Retrieval step
    - Augmentation
    - Generation
    - End-to-end example
    - **Prerequisites**: LLM + vector DB
    - **Time**: 4-5 hours
    - **Resources**: `[███████░░░]` 70%

18. **[langchain-integration](langchain-integration)** - RAG framework
    - LangChain overview
    - Document loaders
    - Vector stores
    - Retrieval chains
    - Chat with documents
    - **Prerequisites**: Python, RAG basics
    - **Time**: 4-5 hours
    - **Resources**: `[███████░░░]` 70%

19. **[rag-production-patterns](rag-production-patterns)** - Scaling RAG
    - Caching strategies
    - Re-ranking results
    - Citation extraction
    - Multi-query RAG
    - Evaluation metrics
    - **Prerequisites**: RAG experience
    - **Time**: 4-5 hours
    - **Resources**: `[████████░░]` 80%

### ⚫ Phase 5: Advanced & Fine-tuning (Expert Level)

20. **[model-quantization](model-quantization)** - Smaller, faster models
    - What is quantization
    - GGUF format
    - Q4, Q5, Q8 models
    - Speed vs accuracy
    - Creating quantized models
    - **Prerequisites**: LLM experience
    - **Time**: 3-4 hours
    - **Resources**: `[██████░░░░]` 60%

21. **[fine-tuning-basics](fine-tuning-basics)** - Custom models
    - When to fine-tune
    - LoRA adapters
    - Dataset preparation
    - Training process
    - Evaluation
    - **Prerequisites**: ML basics, GPU
    - **Time**: 6-8 hours
    - **Resources**: `[█████████░]` 90% - 16GB+ VRAM

22. **[multi-modal-models](multi-modal-models)** - Vision + Language
    - LLaVA (vision models)
    - Image understanding
    - OCR with LLMs
    - Audio models
    - **Prerequisites**: LLM proficiency
    - **Time**: 3-4 hours
    - **Resources**: `[████████░░]` 80%

23. **[agent-frameworks](agent-frameworks)** - Autonomous AI
    - What are agents
    - Tool use
    - ReAct pattern
    - LangGraph
    - Multi-agent systems
    - **Prerequisites**: Advanced LLM usage
    - **Time**: 5-6 hours
    - **Resources**: `[████████░░]` 80%

24. **[gpu-optimization](gpu-optimization)** - Hardware acceleration
    - CUDA setup
    - VRAM management
    - Batch processing
    - Model parallelism
    - Inference optimization
    - **Prerequisites**: GPU hardware
    - **Time**: 4-5 hours
    - **Resources**: `[█████████░]` 90%

## 🔗 What Comes Next?

After mastering local AI:

**For Applications**:
- **[kb/basics/python-advanced](../basics/python-advanced)** - App development

**For Infrastructure**:
- **[kb/containers/gpu-containers](../containers/gpu-containers)** - GPU in Docker

**For Observability**:
- **[kb/observability/ai-monitoring](../observability/ai-monitoring)** - LLM metrics

**For Security**:
- **[kb/security/ai-security](../security/ai-security)** - Secure AI systems

## 📊 Resource Requirements

**Ollama (CPU)**:
- **Small models** (3B-7B): 8GB RAM `[████░░░░░░]` 40%
- **Medium models** (13B-15B): 16GB RAM `[██████░░░░]` 60%
- **Large models** (30B+): 32GB+ RAM `[█████████░]` 90%

**Ollama (GPU)**:
- **7B models**: 6GB VRAM `[████░░░░░░]` 40%
- **13B models**: 12GB VRAM `[██████░░░░]` 60%
- **70B models**: 48GB+ VRAM `[██████████]` 100%

**Vector Databases**:
- **Qdrant** (small): 1GB RAM `[███░░░░░░░]` 30%
- **Qdrant** (millions of vectors): 8GB+ RAM `[████████░░]` 80%

**RAG System** (Ollama + Vector DB + App):
- **Minimal**: 10GB RAM `[█████░░░░░]` 50%
- **Comfortable**: 16GB RAM + GPU `[███████░░░]` 70%
- **Production**: 32GB RAM + 12GB VRAM `[█████████░]` 90%

**Learning Time Investment**:
- **LLM Basics**: 1-2 weeks `[████░░░░░░]` 40%
- **Integration**: 2-3 weeks `[█████░░░░░]` 50%
- **Vector Databases**: 1-2 weeks `[████░░░░░░]` 40%
- **RAG Systems**: 3-4 weeks `[███████░░░]` 70%
- **Advanced Topics**: 2-3 months `[█████████░]` 90%
- **Production Mastery**: 6-12 months `[██████████]` 100%

## 🛠️ Recommended Tool Stack

**LLM Inference**:
- **Ollama** `[██████████]` Required - Easiest local LLMs
- **vLLM** `[███████░░░]` 70% - Production inference
- **LocalAI** `[██████░░░░]` 60% - OpenAI alternative

**Vector Databases**:
- **Qdrant** `[█████████░]` 90% - Fast, Rust-based
- **Milvus** `[████████░░]` 80% - Scalable, feature-rich
- **ChromaDB** `[███████░░░]` 70% - Simple, embedded
- **Pgvector** `[██████░░░░]` 60% - Postgres extension

**RAG Frameworks**:
- **LangChain** `[█████████░]` 90% - Most popular
- **LlamaIndex** `[████████░░]` 80% - RAG-focused
- **Haystack** `[███████░░░]` 70% - NLP pipelines

**Embeddings**:
- **sentence-transformers** `[█████████░]` 90% - Python library
- **Ollama embeddings** `[████████░░]` 80% - Built-in

**Supporting Tools**:
- **Open WebUI** `[████████░░]` 80% - ChatGPT-like UI
- **AnythingLLM** `[███████░░░]` 70% - RAG UI
- **LiteLLM** `[██████░░░░]` 60% - Unified API

## 💡 Pro Tips for Local AI

1. **Start with Ollama**: Easiest way to run local LLMs
2. **GPU is Optional**: CPU works, just slower
3. **7B Models Sweet Spot**: Good balance of speed/quality
4. **RAG > Fine-tuning**: For most use cases
5. **Chunk Size Matters**: 500-1000 tokens usually optimal
6. **Test Multiple Models**: Different models for different tasks
7. **Quantization is Your Friend**: Q4 models are fast
8. **Monitor VRAM**: Easy to run out of memory
9. **Streaming is Better UX**: Show results as they generate
10. **Embeddings are Cheap**: Cache them aggressively

## 🔄 Common AI/ML Pitfalls

**Pitfall 1: Running Huge Models**
- 70B model on 16GB RAM = swap thrashing
- **Fix**: Start with 7B-13B models

**Pitfall 2: Ignoring Context Limits**
- Dumping 50 pages into prompt
- **Fix**: Use RAG for large documents

**Pitfall 3: No Evaluation**
- Not testing output quality
- **Fix**: Define metrics, test systematically

**Pitfall 4: Over-engineering**
- Complex agent systems for simple tasks
- **Fix**: Start simple, add complexity when needed

**Pitfall 5: Poor Chunking**
- Too small = no context, too large = irrelevant
- **Fix**: Experiment, 500-1000 tokens typical

**Pitfall 6: Ignoring Latency**
- Huge models in user-facing apps
- **Fix**: Smaller models, caching, async

**Pitfall 7: No Prompt Versioning**
- Changing prompts breaks things
- **Fix**: Version control prompts

**Pitfall 8: Trusting Outputs Blindly**
- LLMs hallucinate, confidently
- **Fix**: Validation, citations, human review

## 🔗 Related KB Sections

- **[kb/containers/](../containers/)** - Docker for AI services
- **[kb/infrastructure/](../infrastructure/)** - IaC for AI infra
- **[kb/observability/](../observability/)** - Monitor AI systems
- **[kb/security/](../security/)** - Secure AI deployments
- **[kb/basics/python-basics](../basics/python-basics)** - Python skills

## 📝 Change Log

### 2026-01-30
- Created AI/ML directory structure
- Defined complete learning path from LLMs to RAG
- Established Ollama + Qdrant + LangChain as core stack
- Listed all planned articles with time estimates
- Added resource requirements for AI workloads
- Emphasized self-hosted, privacy-focused approach
- Organized by learning phases (1-5)
- Added tool recommendations with ratings
- Cross-referenced related KB sections
- Included production AI patterns

---

**🤖 Remember**: You don't need cloud APIs to run AI! Ollama makes local LLMs dead simple. Start with a 7B model, add RAG with Qdrant for your documents, and build AI apps that keep your data private. GPU optional - CPU works fine for many use cases!

