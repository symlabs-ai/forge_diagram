/**
 * Mermaid diagram templates
 */

export interface DiagramTemplate {
  id: string;
  name: string;
  category: 'flowchart' | 'sequence' | 'class' | 'er' | 'state' | 'gantt' | 'other';
  description: string;
  code: string;
}

export const templates: DiagramTemplate[] = [
  // Flowcharts
  {
    id: 'flowchart-basic',
    name: 'Flowchart Basic',
    category: 'flowchart',
    description: 'Simple flowchart with decision',
    code: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`,
  },
  {
    id: 'flowchart-process',
    name: 'Process Flow',
    category: 'flowchart',
    description: 'Business process workflow',
    code: `flowchart LR
    A[Request] --> B[Review]
    B --> C{Approved?}
    C -->|Yes| D[Process]
    C -->|No| E[Reject]
    D --> F[Complete]
    E --> G[Notify]`,
  },
  {
    id: 'flowchart-subgraph',
    name: 'With Subgraphs',
    category: 'flowchart',
    description: 'Flowchart with grouped sections',
    code: `flowchart TB
    subgraph Frontend
        A[User Interface] --> B[API Client]
    end
    subgraph Backend
        C[API Server] --> D[Database]
    end
    B --> C`,
  },

  // Sequence Diagrams
  {
    id: 'sequence-basic',
    name: 'Sequence Basic',
    category: 'sequence',
    description: 'Simple message exchange',
    code: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hi Alice!
    A->>B: How are you?
    B-->>A: I'm fine, thanks!`,
  },
  {
    id: 'sequence-auth',
    name: 'Authentication Flow',
    category: 'sequence',
    description: 'Login authentication sequence',
    code: `sequenceDiagram
    participant U as User
    participant C as Client
    participant S as Server
    participant D as Database

    U->>C: Enter credentials
    C->>S: POST /login
    S->>D: Validate user
    D-->>S: User found
    S-->>C: JWT Token
    C-->>U: Login success`,
  },
  {
    id: 'sequence-async',
    name: 'Async Operations',
    category: 'sequence',
    description: 'Asynchronous message flow',
    code: `sequenceDiagram
    participant C as Client
    participant S as Server
    participant Q as Queue
    participant W as Worker

    C->>S: Submit job
    activate S
    S->>Q: Enqueue task
    S-->>C: Job ID: 123
    deactivate S
    Q->>W: Process task
    activate W
    W-->>Q: Complete
    deactivate W
    C->>S: Check status
    S-->>C: Completed`,
  },

  // Class Diagrams
  {
    id: 'class-basic',
    name: 'Class Basic',
    category: 'class',
    description: 'Simple class with inheritance',
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
        +fetch()
    }
    class Cat {
        +String color
        +meow()
        +scratch()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
  },
  {
    id: 'class-relationships',
    name: 'Class Relationships',
    category: 'class',
    description: 'Various class relationships',
    code: `classDiagram
    class Order {
        +int orderId
        +Date orderDate
        +calculateTotal()
    }
    class Customer {
        +String name
        +String email
    }
    class Product {
        +String name
        +float price
    }
    class Payment {
        +float amount
        +process()
    }
    Customer "1" --> "*" Order : places
    Order "*" --> "*" Product : contains
    Order "1" --> "1" Payment : has`,
  },

  // ER Diagrams
  {
    id: 'er-basic',
    name: 'ER Basic',
    category: 'er',
    description: 'Simple entity relationship',
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : includes
    CUSTOMER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        date created
        int customer_id FK
    }
    PRODUCT {
        int id PK
        string name
        float price
    }`,
  },
  {
    id: 'er-ecommerce',
    name: 'E-commerce Schema',
    category: 'er',
    description: 'E-commerce database schema',
    code: `erDiagram
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    PRODUCT ||--o{ REVIEW : "reviewed in"
    CATEGORY ||--o{ PRODUCT : contains

    USER {
        int id PK
        string email UK
        string password
        date created_at
    }
    PRODUCT {
        int id PK
        string name
        float price
        int category_id FK
    }`,
  },

  // State Diagrams
  {
    id: 'state-basic',
    name: 'State Basic',
    category: 'state',
    description: 'Simple state machine',
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : start
    Processing --> Success : complete
    Processing --> Error : fail
    Error --> Idle : retry
    Success --> [*]`,
  },
  {
    id: 'state-order',
    name: 'Order States',
    category: 'state',
    description: 'Order lifecycle states',
    code: `stateDiagram-v2
    [*] --> Pending
    Pending --> Confirmed : confirm
    Pending --> Cancelled : cancel
    Confirmed --> Shipped : ship
    Shipped --> Delivered : deliver
    Delivered --> [*]

    state Shipped {
        [*] --> InTransit
        InTransit --> OutForDelivery
        OutForDelivery --> [*]
    }`,
  },

  // Gantt Charts
  {
    id: 'gantt-basic',
    name: 'Gantt Basic',
    category: 'gantt',
    description: 'Simple project timeline',
    code: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD

    section Planning
    Requirements    :a1, 2024-01-01, 7d
    Design          :a2, after a1, 5d

    section Development
    Backend         :b1, after a2, 14d
    Frontend        :b2, after a2, 14d

    section Testing
    Integration     :c1, after b1, 7d
    UAT             :c2, after c1, 5d`,
  },
  {
    id: 'gantt-sprint',
    name: 'Sprint Planning',
    category: 'gantt',
    description: 'Agile sprint timeline',
    code: `gantt
    title Sprint 1
    dateFormat YYYY-MM-DD

    section User Stories
    US-001 Login    :us1, 2024-01-01, 3d
    US-002 Dashboard:us2, after us1, 4d
    US-003 Reports  :us3, after us2, 3d

    section Technical
    Setup CI/CD     :t1, 2024-01-01, 2d
    Code Review     :t2, after us3, 2d

    section QA
    Testing         :qa1, after t2, 2d
    Bug Fixes       :qa2, after qa1, 1d`,
  },

  // Other Diagrams
  {
    id: 'pie-basic',
    name: 'Pie Chart',
    category: 'other',
    description: 'Simple pie chart',
    code: `pie title Browser Market Share
    "Chrome" : 65
    "Safari" : 19
    "Firefox" : 10
    "Edge" : 4
    "Other" : 2`,
  },
  {
    id: 'mindmap-basic',
    name: 'Mind Map',
    category: 'other',
    description: 'Mind map diagram',
    code: `mindmap
  root((Project))
    Planning
      Requirements
      Timeline
      Budget
    Development
      Frontend
      Backend
      Database
    Testing
      Unit Tests
      Integration
      UAT`,
  },
  {
    id: 'journey-basic',
    name: 'User Journey',
    category: 'other',
    description: 'User journey map',
    code: `journey
    title User Purchase Journey
    section Discovery
      Visit website: 5: User
      Browse products: 4: User
      Read reviews: 3: User
    section Purchase
      Add to cart: 5: User
      Checkout: 3: User
      Payment: 4: User
    section Post-Purchase
      Receive order: 5: User
      Leave review: 4: User`,
  },
];

/**
 * Obtém templates por categoria
 */
export function getTemplatesByCategory(category: DiagramTemplate['category']): DiagramTemplate[] {
  return templates.filter(t => t.category === category);
}

/**
 * Obtém template por ID
 */
export function getTemplateById(id: string): DiagramTemplate | undefined {
  return templates.find(t => t.id === id);
}

/**
 * Obtém todas as categorias únicas
 */
export function getCategories(): DiagramTemplate['category'][] {
  return [...new Set(templates.map(t => t.category))];
}

/**
 * Agrupa templates por categoria
 */
export function getTemplatesGroupedByCategory(): Record<string, DiagramTemplate[]> {
  return templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, DiagramTemplate[]>);
}
