import { getPlatformProxy } from 'wrangler'
import { generateUlid } from '../lib/ulid'
import { now } from '../lib/timestamp'
import { createDb } from './index'
import * as schema from './schema'

const timestamp = now()

function id() {
  return generateUlid()
}

// --- Tag IDs (referenced by question sets and questions) ---
const networkTag = id()
const securityTag = id()
const computeTag = id()
const storageTag = id()
const databaseTag = id()
const managementTag = id()
const architectureTag = id()
const softwareEngTag = id()

// --- Category IDs (referenced by question sets) ---
const catSAA = id()
const catAP = id()
const catCLF = id()

// --- Question Set IDs ---
const qsNetworking = id()
const qsComputeStorage = id()
const qsArchDesign = id()
const qsSecurity = id()
const qsNetworkTech = id()
const qsCloudConcepts = id()
const qsSecCompliance = id()

export const seedData = {
  categories: [
    {
      id: catSAA,
      name: 'AWS Solutions Architect Associate',
      description: 'AWS SAA-C03 certification exam preparation',
      passScore: 72,
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: catAP,
      name: '応用情報技術者試験',
      description: 'IPA 応用情報技術者試験対策',
      passScore: 60,
      sortOrder: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: catCLF,
      name: 'AWS Cloud Practitioner',
      description: 'AWS CLF-C02 certification exam preparation',
      passScore: 70,
      sortOrder: 2,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],

  tags: [
    { id: networkTag, name: 'Networking', color: '#3B82F6', createdAt: timestamp },
    { id: securityTag, name: 'Security', color: '#EF4444', createdAt: timestamp },
    { id: computeTag, name: 'Compute', color: '#F59E0B', createdAt: timestamp },
    { id: storageTag, name: 'Storage', color: '#10B981', createdAt: timestamp },
    { id: databaseTag, name: 'Database', color: '#8B5CF6', createdAt: timestamp },
    { id: managementTag, name: 'Management', color: '#EC4899', createdAt: timestamp },
    { id: architectureTag, name: 'Architecture', color: '#6366F1', createdAt: timestamp },
    { id: softwareEngTag, name: 'Software Engineering', color: '#14B8A6', createdAt: timestamp },
  ],

  questionSets: [
    // ========================================
    // AWS SAA - Networking Basics
    // ========================================
    {
      set: {
        id: qsNetworking,
        categoryId: catSAA,
        title: 'AWS Networking Basics',
        description: 'VPC, Subnets, Route Tables, Security Groups',
        timeLimit: 1800,
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tagIds: [networkTag],
      questions: [
        {
          id: id(),
          body: 'What is the maximum number of VPCs per region by default?',
          explanation: 'The default limit is 5 VPCs per region, but this can be increased by requesting a limit increase from AWS.',
          isMultiAnswer: false,
          sortOrder: 0,
          tagIds: [networkTag],
          choices: [
            { body: '3', isCorrect: false, explanation: null, sortOrder: 0 },
            { body: '5', isCorrect: true, explanation: 'Default VPC limit per region is 5.', sortOrder: 1 },
            { body: '10', isCorrect: false, explanation: null, sortOrder: 2 },
            { body: '20', isCorrect: false, explanation: null, sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'Which of the following are valid VPC components? (Select TWO)',
          explanation: 'VPCs consist of subnets, route tables, internet gateways, NAT gateways, security groups, and network ACLs.',
          isMultiAnswer: true,
          sortOrder: 1,
          tagIds: [networkTag, securityTag],
          choices: [
            { body: 'Subnet', isCorrect: true, explanation: 'Subnets are fundamental VPC components.', sortOrder: 0 },
            { body: 'EC2 Instance', isCorrect: false, explanation: 'EC2 instances run inside VPCs but are not VPC components.', sortOrder: 1 },
            { body: 'Internet Gateway', isCorrect: true, explanation: 'Internet Gateways enable internet access for VPC resources.', sortOrder: 2 },
            { body: 'S3 Bucket', isCorrect: false, explanation: 'S3 is a global service, not a VPC component.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'What is the purpose of a NAT Gateway?\n\n```mermaid\ngraph LR\n  A[Private Subnet] --> B[NAT Gateway]\n  B --> C[Internet Gateway]\n  C --> D[Internet]\n```',
          explanation: 'A NAT Gateway allows instances in private subnets to access the internet while preventing inbound connections from the internet.',
          isMultiAnswer: false,
          sortOrder: 2,
          tagIds: [networkTag],
          choices: [
            { body: 'Allow internet access from private subnets', isCorrect: true, explanation: 'NAT Gateway enables outbound internet access for private subnet resources.', sortOrder: 0 },
            { body: 'Provide DNS resolution', isCorrect: false, explanation: 'DNS resolution is handled by Route 53 or VPC DNS.', sortOrder: 1 },
            { body: 'Load balance traffic', isCorrect: false, explanation: 'Load balancing is done by ELB/ALB.', sortOrder: 2 },
            { body: 'Encrypt network traffic', isCorrect: false, explanation: 'Encryption is handled by TLS/SSL, not NAT.', sortOrder: 3 },
          ],
        },
      ],
    },

    // ========================================
    // AWS SAA - Compute & Storage
    // ========================================
    {
      set: {
        id: qsComputeStorage,
        categoryId: catSAA,
        title: 'AWS Compute & Storage',
        description: 'EC2, Lambda, S3, EBS fundamentals',
        timeLimit: 2400,
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tagIds: [computeTag, storageTag],
      questions: [
        {
          id: id(),
          body: 'Which EC2 instance type is optimized for memory-intensive workloads?',
          explanation: 'R-series instances (e.g., R5, R6g) are memory-optimized, designed for workloads that process large data sets in memory.',
          isMultiAnswer: false,
          sortOrder: 0,
          tagIds: [computeTag],
          choices: [
            { body: 'C5 (Compute optimized)', isCorrect: false, explanation: 'C5 is compute-optimized, not memory-optimized.', sortOrder: 0 },
            { body: 'R5 (Memory optimized)', isCorrect: true, explanation: 'R5 instances are designed for memory-intensive applications.', sortOrder: 1 },
            { body: 'T3 (Burstable)', isCorrect: false, explanation: 'T3 is a general-purpose burstable instance.', sortOrder: 2 },
            { body: 'I3 (Storage optimized)', isCorrect: false, explanation: 'I3 is optimized for storage, not memory.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'What is the maximum size of a single object in Amazon S3?',
          explanation: 'The maximum size for a single S3 object is 5 TB. For objects larger than 5 GB, you must use multipart upload.',
          isMultiAnswer: false,
          sortOrder: 1,
          tagIds: [storageTag],
          choices: [
            { body: '5 GB', isCorrect: false, explanation: '5 GB is the limit for a single PUT operation, not the object size limit.', sortOrder: 0 },
            { body: '5 TB', isCorrect: true, explanation: 'S3 supports objects up to 5 TB in size.', sortOrder: 1 },
            { body: '1 TB', isCorrect: false, explanation: null, sortOrder: 2 },
            { body: 'Unlimited', isCorrect: false, explanation: 'There is a 5 TB per-object limit.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'Which of the following are valid AWS Lambda triggers? (Select TWO)',
          explanation: 'Lambda can be triggered by many AWS services including API Gateway, S3, DynamoDB Streams, SNS, SQS, and more.',
          isMultiAnswer: true,
          sortOrder: 2,
          tagIds: [computeTag],
          choices: [
            { body: 'API Gateway', isCorrect: true, explanation: 'API Gateway is one of the most common Lambda triggers.', sortOrder: 0 },
            { body: 'EC2 Instance', isCorrect: false, explanation: 'EC2 instances do not directly trigger Lambda functions.', sortOrder: 1 },
            { body: 'S3 Event Notification', isCorrect: true, explanation: 'S3 events (e.g., object created) can trigger Lambda.', sortOrder: 2 },
            { body: 'VPC Flow Logs', isCorrect: false, explanation: 'VPC Flow Logs send data to CloudWatch Logs or S3, not directly to Lambda.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'Which EBS volume type provides the highest IOPS performance?',
          explanation: 'io2 Block Express volumes support up to 256,000 IOPS, making them the highest-performance EBS volume type.',
          isMultiAnswer: false,
          sortOrder: 3,
          tagIds: [storageTag],
          choices: [
            { body: 'gp3 (General Purpose SSD)', isCorrect: false, explanation: 'gp3 supports up to 16,000 IOPS.', sortOrder: 0 },
            { body: 'io2 Block Express (Provisioned IOPS SSD)', isCorrect: true, explanation: 'io2 Block Express supports up to 256,000 IOPS.', sortOrder: 1 },
            { body: 'st1 (Throughput Optimized HDD)', isCorrect: false, explanation: 'st1 is HDD-based and optimized for throughput, not IOPS.', sortOrder: 2 },
            { body: 'sc1 (Cold HDD)', isCorrect: false, explanation: 'sc1 is the lowest-cost HDD option for infrequently accessed data.', sortOrder: 3 },
          ],
        },
      ],
    },

    // ========================================
    // AWS SAA - Architecture Design
    // ========================================
    {
      set: {
        id: qsArchDesign,
        categoryId: catSAA,
        title: 'AWS Architecture Design',
        description: 'Well-Architected Framework, high availability, scalability patterns',
        timeLimit: 1800,
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tagIds: [architectureTag],
      questions: [
        {
          id: id(),
          body: 'Which pillar of the AWS Well-Architected Framework focuses on protecting information and systems?',
          explanation: 'The Security pillar focuses on protecting information, systems, and assets while delivering business value through risk assessments and mitigation strategies.',
          isMultiAnswer: false,
          sortOrder: 0,
          tagIds: [architectureTag, securityTag],
          choices: [
            { body: 'Operational Excellence', isCorrect: false, explanation: 'Operational Excellence focuses on running and monitoring systems.', sortOrder: 0 },
            { body: 'Security', isCorrect: true, explanation: 'The Security pillar addresses data protection, privilege management, and infrastructure protection.', sortOrder: 1 },
            { body: 'Reliability', isCorrect: false, explanation: 'Reliability focuses on the ability of a system to recover from failures.', sortOrder: 2 },
            { body: 'Performance Efficiency', isCorrect: false, explanation: 'Performance Efficiency focuses on using resources efficiently.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'A company needs a database solution that automatically replicates across 3 Availability Zones. Which service should they use?',
          explanation: 'Amazon Aurora automatically replicates data across 3 AZs with 6 copies of your data, providing high availability and durability.',
          isMultiAnswer: false,
          sortOrder: 1,
          tagIds: [databaseTag, architectureTag],
          choices: [
            { body: 'Amazon RDS Single-AZ', isCorrect: false, explanation: 'Single-AZ does not replicate across multiple AZs.', sortOrder: 0 },
            { body: 'Amazon Aurora', isCorrect: true, explanation: 'Aurora replicates 6 copies of data across 3 AZs automatically.', sortOrder: 1 },
            { body: 'Amazon DynamoDB', isCorrect: false, explanation: 'DynamoDB is a NoSQL service with different replication characteristics.', sortOrder: 2 },
            { body: 'Amazon ElastiCache', isCorrect: false, explanation: 'ElastiCache is an in-memory cache, not a relational database.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'Which of the following are benefits of using Auto Scaling? (Select TWO)',
          explanation: 'Auto Scaling improves fault tolerance by replacing unhealthy instances and optimizes costs by scaling in during low demand.',
          isMultiAnswer: true,
          sortOrder: 2,
          tagIds: [architectureTag, computeTag],
          choices: [
            { body: 'Improved fault tolerance', isCorrect: true, explanation: 'Auto Scaling detects and replaces unhealthy instances automatically.', sortOrder: 0 },
            { body: 'Reduced network latency', isCorrect: false, explanation: 'Network latency is primarily addressed by CloudFront or Global Accelerator.', sortOrder: 1 },
            { body: 'Cost optimization', isCorrect: true, explanation: 'Auto Scaling adjusts capacity to match demand, reducing costs during low usage.', sortOrder: 2 },
            { body: 'Data encryption', isCorrect: false, explanation: 'Data encryption is handled by KMS, not Auto Scaling.', sortOrder: 3 },
          ],
        },
      ],
    },

    // ========================================
    // 応用情報 - 情報セキュリティ
    // ========================================
    {
      set: {
        id: qsSecurity,
        categoryId: catAP,
        title: '情報セキュリティ',
        description: '暗号化、認証、ネットワークセキュリティ',
        timeLimit: 2400,
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tagIds: [securityTag],
      questions: [
        {
          id: id(),
          body: '公開鍵暗号方式において、送信者が受信者に暗号文を送る場合、暗号化に使用する鍵はどれか。',
          explanation: '公開鍵暗号方式では、受信者の公開鍵で暗号化し、受信者の秘密鍵で復号します。',
          isMultiAnswer: false,
          sortOrder: 0,
          tagIds: [securityTag],
          choices: [
            { body: '送信者の公開鍵', isCorrect: false, explanation: '送信者の公開鍵は、デジタル署名の検証に使用されます。', sortOrder: 0 },
            { body: '送信者の秘密鍵', isCorrect: false, explanation: '送信者の秘密鍵は、デジタル署名の作成に使用されます。', sortOrder: 1 },
            { body: '受信者の公開鍵', isCorrect: true, explanation: '受信者の公開鍵で暗号化することで、受信者だけが復号できます。', sortOrder: 2 },
            { body: '受信者の秘密鍵', isCorrect: false, explanation: '秘密鍵は所有者のみが持ち、他者に渡すことはありません。', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'SQLインジェクション攻撃への対策として、最も効果的なものはどれか。',
          explanation: 'バインド機構（プレースホルダ）を使用することで、SQL文とパラメータを分離し、SQLインジェクションを防止できます。',
          isMultiAnswer: false,
          sortOrder: 1,
          tagIds: [securityTag],
          choices: [
            { body: 'ファイアウォールの導入', isCorrect: false, explanation: 'ファイアウォールはネットワーク層の防御であり、アプリケーション層の攻撃には効果が限定的です。', sortOrder: 0 },
            { body: 'バインド機構（プレースホルダ）の使用', isCorrect: true, explanation: 'SQL文のパラメータをバインド変数で指定することで、不正なSQL文の実行を防止します。', sortOrder: 1 },
            { body: 'SSL/TLSの導入', isCorrect: false, explanation: 'SSL/TLSは通信の暗号化であり、SQLインジェクションの対策にはなりません。', sortOrder: 2 },
            { body: 'パスワードの定期変更', isCorrect: false, explanation: 'パスワード管理はSQLインジェクションとは無関係です。', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'デジタル署名で実現できることとして、正しいものを2つ選べ。',
          explanation: 'デジタル署名は、送信者の認証（なりすまし防止）とメッセージの改ざん検知を実現します。機密性の確保には暗号化が必要です。',
          isMultiAnswer: true,
          sortOrder: 2,
          tagIds: [securityTag],
          choices: [
            { body: '送信者の認証', isCorrect: true, explanation: '秘密鍵で署名することで、送信者を証明できます。', sortOrder: 0 },
            { body: '通信内容の機密性確保', isCorrect: false, explanation: '機密性は暗号化で実現します。デジタル署名は暗号化とは異なります。', sortOrder: 1 },
            { body: 'メッセージの改ざん検知', isCorrect: true, explanation: 'メッセージが改ざんされると署名検証に失敗するため、改ざんを検知できます。', sortOrder: 2 },
            { body: '通信経路の匿名化', isCorrect: false, explanation: '匿名化にはVPNやTorなどが使用されます。', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'XSS（クロスサイトスクリプティング）の説明として、正しいものはどれか。',
          explanation: 'XSSは、Webアプリケーションの脆弱性を利用して、悪意のあるスクリプトをユーザーのブラウザで実行させる攻撃です。',
          isMultiAnswer: false,
          sortOrder: 3,
          tagIds: [securityTag],
          choices: [
            { body: 'WebサイトにスクリプトをSQL文に含めて送信し、データベースを不正に操作する攻撃', isCorrect: false, explanation: 'これはSQLインジェクションの説明です。', sortOrder: 0 },
            { body: 'Webアプリケーションの脆弱性を利用して、悪意のあるスクリプトをユーザーのブラウザで実行させる攻撃', isCorrect: true, explanation: 'XSSの正しい説明です。入力値のサニタイズが対策となります。', sortOrder: 1 },
            { body: 'セッションIDを推測して、他人になりすます攻撃', isCorrect: false, explanation: 'これはセッションハイジャックの説明です。', sortOrder: 2 },
            { body: '大量のリクエストを送りつけて、サーバーを過負荷にする攻撃', isCorrect: false, explanation: 'これはDoS/DDoS攻撃の説明です。', sortOrder: 3 },
          ],
        },
      ],
    },

    // ========================================
    // 応用情報 - ネットワーク技術
    // ========================================
    {
      set: {
        id: qsNetworkTech,
        categoryId: catAP,
        title: 'ネットワーク技術',
        description: 'TCP/IP、DNS、ルーティング、プロトコル',
        timeLimit: 1800,
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tagIds: [networkTag, softwareEngTag],
      questions: [
        {
          id: id(),
          body: 'OSI参照モデルにおいて、トランスポート層のプロトコルはどれか。',
          explanation: 'TCPとUDPはOSI参照モデルの第4層（トランスポート層）に位置するプロトコルです。',
          isMultiAnswer: false,
          sortOrder: 0,
          tagIds: [networkTag],
          choices: [
            { body: 'HTTP', isCorrect: false, explanation: 'HTTPはアプリケーション層（第7層）のプロトコルです。', sortOrder: 0 },
            { body: 'TCP', isCorrect: true, explanation: 'TCPはトランスポート層で信頼性のある通信を提供します。', sortOrder: 1 },
            { body: 'IP', isCorrect: false, explanation: 'IPはネットワーク層（第3層）のプロトコルです。', sortOrder: 2 },
            { body: 'Ethernet', isCorrect: false, explanation: 'Ethernetはデータリンク層（第2層）のプロトコルです。', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'サブネットマスクが 255.255.255.192 の場合、1つのサブネットに収容できるホスト数はいくつか。',
          explanation: '/26のサブネットマスクでは、ホスト部は6ビット（2^6 = 64）。ネットワークアドレスとブロードキャストアドレスを除き、62台のホストを収容できます。',
          isMultiAnswer: false,
          sortOrder: 1,
          tagIds: [networkTag],
          choices: [
            { body: '30', isCorrect: false, explanation: '30は/27（255.255.255.224）の場合のホスト数です。', sortOrder: 0 },
            { body: '62', isCorrect: true, explanation: '2^6 - 2 = 62台のホストを収容できます。', sortOrder: 1 },
            { body: '64', isCorrect: false, explanation: 'ネットワークアドレスとブロードキャストアドレスを除く必要があります。', sortOrder: 2 },
            { body: '126', isCorrect: false, explanation: '126は/25（255.255.255.128）の場合のホスト数です。', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'DNSのレコードタイプについて、ドメイン名からIPv4アドレスを解決するレコードはどれか。',
          explanation: 'Aレコードはドメイン名をIPv4アドレスにマッピングします。AAAAレコードはIPv6用です。',
          isMultiAnswer: false,
          sortOrder: 2,
          tagIds: [networkTag],
          choices: [
            { body: 'A レコード', isCorrect: true, explanation: 'Aレコードはドメイン名からIPv4アドレスへの変換に使用されます。', sortOrder: 0 },
            { body: 'CNAME レコード', isCorrect: false, explanation: 'CNAMEレコードはドメイン名の別名（エイリアス）を定義します。', sortOrder: 1 },
            { body: 'MX レコード', isCorrect: false, explanation: 'MXレコードはメールサーバーの指定に使用されます。', sortOrder: 2 },
            { body: 'TXT レコード', isCorrect: false, explanation: 'TXTレコードは任意のテキスト情報を格納します。', sortOrder: 3 },
          ],
        },
      ],
    },

    // ========================================
    // AWS CLF - Cloud Concepts
    // ========================================
    {
      set: {
        id: qsCloudConcepts,
        categoryId: catCLF,
        title: 'Cloud Concepts',
        description: 'Cloud computing fundamentals, AWS global infrastructure',
        timeLimit: 1800,
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tagIds: [architectureTag, managementTag],
      questions: [
        {
          id: id(),
          body: 'Which of the following is a benefit of cloud computing?',
          explanation: 'Cloud computing allows you to trade capital expense for variable expense, paying only for the resources you consume.',
          isMultiAnswer: false,
          sortOrder: 0,
          tagIds: [architectureTag],
          choices: [
            { body: 'Trade variable expense for capital expense', isCorrect: false, explanation: 'Cloud computing does the opposite — it trades capital expense for variable expense.', sortOrder: 0 },
            { body: 'Trade capital expense for variable expense', isCorrect: true, explanation: 'You pay only for the computing resources you consume instead of investing in data centers upfront.', sortOrder: 1 },
            { body: 'Increased time to deploy applications globally', isCorrect: false, explanation: 'Cloud computing decreases deployment time through global infrastructure.', sortOrder: 2 },
            { body: 'Fixed capacity provisioning', isCorrect: false, explanation: 'Cloud computing provides elastic capacity, not fixed.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'What is an AWS Region?',
          explanation: 'An AWS Region is a physical location around the world consisting of multiple Availability Zones, each with independent power, networking, and connectivity.',
          isMultiAnswer: false,
          sortOrder: 1,
          tagIds: [architectureTag],
          choices: [
            { body: 'A single data center', isCorrect: false, explanation: 'A Region contains multiple Availability Zones, each with one or more data centers.', sortOrder: 0 },
            { body: 'A geographic area with multiple isolated Availability Zones', isCorrect: true, explanation: 'Each Region has multiple AZs for fault tolerance and high availability.', sortOrder: 1 },
            { body: 'A content delivery network edge location', isCorrect: false, explanation: 'Edge locations are part of CloudFront, not Regions.', sortOrder: 2 },
            { body: 'A virtual private network', isCorrect: false, explanation: 'VPNs are networking constructs, not AWS Regions.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'Which cloud computing model provides the most control over IT resources?',
          explanation: 'IaaS provides the highest level of control over IT resources, giving access to networking features, computers, and data storage.',
          isMultiAnswer: false,
          sortOrder: 2,
          tagIds: [architectureTag],
          choices: [
            { body: 'SaaS (Software as a Service)', isCorrect: false, explanation: 'SaaS provides the least control — the provider manages everything.', sortOrder: 0 },
            { body: 'PaaS (Platform as a Service)', isCorrect: false, explanation: 'PaaS manages the underlying infrastructure; you manage applications and data.', sortOrder: 1 },
            { body: 'IaaS (Infrastructure as a Service)', isCorrect: true, explanation: 'IaaS gives the most control, managing OS, storage, networking, and deployed applications.', sortOrder: 2 },
            { body: 'FaaS (Function as a Service)', isCorrect: false, explanation: 'FaaS abstracts away servers entirely; you only manage function code.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'Which of the following are part of the AWS shared responsibility model as the customer\'s responsibility? (Select TWO)',
          explanation: 'In the shared responsibility model, the customer is responsible for security IN the cloud, including data encryption and OS patching on EC2 instances.',
          isMultiAnswer: true,
          sortOrder: 3,
          tagIds: [securityTag, managementTag],
          choices: [
            { body: 'Patching the guest operating system on EC2', isCorrect: true, explanation: 'Customers are responsible for patching and maintaining their own OS on EC2.', sortOrder: 0 },
            { body: 'Physical security of data centers', isCorrect: false, explanation: 'Physical security is AWS\'s responsibility.', sortOrder: 1 },
            { body: 'Encrypting customer data', isCorrect: true, explanation: 'Customers are responsible for encrypting their own data at rest and in transit.', sortOrder: 2 },
            { body: 'Maintaining host operating systems of Lambda', isCorrect: false, explanation: 'Lambda is a managed service; AWS maintains the underlying infrastructure.', sortOrder: 3 },
          ],
        },
      ],
    },

    // ========================================
    // AWS CLF - Security & Compliance
    // ========================================
    {
      set: {
        id: qsSecCompliance,
        categoryId: catCLF,
        title: 'Security & Compliance',
        description: 'IAM, security best practices, compliance programs',
        timeLimit: 1800,
        isPublished: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      tagIds: [securityTag, managementTag],
      questions: [
        {
          id: id(),
          body: 'What is the recommended way to grant permissions to an EC2 instance to access other AWS services?',
          explanation: 'IAM roles allow you to grant permissions to EC2 instances without embedding credentials. The instance assumes the role and receives temporary credentials.',
          isMultiAnswer: false,
          sortOrder: 0,
          tagIds: [securityTag],
          choices: [
            { body: 'Store access keys in the application code', isCorrect: false, explanation: 'Hardcoding credentials is a security anti-pattern.', sortOrder: 0 },
            { body: 'Use an IAM role attached to the instance', isCorrect: true, explanation: 'IAM roles provide temporary credentials automatically rotated by AWS.', sortOrder: 1 },
            { body: 'Store credentials in environment variables', isCorrect: false, explanation: 'While better than hardcoding, IAM roles are the recommended approach.', sortOrder: 2 },
            { body: 'Use the root account credentials', isCorrect: false, explanation: 'Using root credentials violates the principle of least privilege.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'Which AWS service provides a centralized view of security alerts and compliance status?',
          explanation: 'AWS Security Hub provides a comprehensive view of your security state, aggregating findings from multiple AWS services and partner tools.',
          isMultiAnswer: false,
          sortOrder: 1,
          tagIds: [securityTag, managementTag],
          choices: [
            { body: 'AWS CloudTrail', isCorrect: false, explanation: 'CloudTrail records API calls but does not aggregate security findings.', sortOrder: 0 },
            { body: 'AWS Security Hub', isCorrect: true, explanation: 'Security Hub aggregates and prioritizes security findings from multiple sources.', sortOrder: 1 },
            { body: 'Amazon GuardDuty', isCorrect: false, explanation: 'GuardDuty detects threats but is one input to Security Hub, not the aggregator itself.', sortOrder: 2 },
            { body: 'AWS Config', isCorrect: false, explanation: 'AWS Config tracks resource configuration changes, not security alerts.', sortOrder: 3 },
          ],
        },
        {
          id: id(),
          body: 'What is the principle of least privilege?',
          explanation: 'The principle of least privilege means granting only the minimum permissions necessary for a user or service to perform its intended function.',
          isMultiAnswer: false,
          sortOrder: 2,
          tagIds: [securityTag],
          choices: [
            { body: 'All users should have administrator access for convenience', isCorrect: false, explanation: 'This violates the principle of least privilege and increases security risk.', sortOrder: 0 },
            { body: 'Grant only the minimum permissions necessary to perform a task', isCorrect: true, explanation: 'Limiting permissions reduces the blast radius of compromised credentials.', sortOrder: 1 },
            { body: 'Users should share credentials to reduce the number of accounts', isCorrect: false, explanation: 'Sharing credentials violates security best practices and makes auditing impossible.', sortOrder: 2 },
            { body: 'Permissions should be granted based on job title alone', isCorrect: false, explanation: 'Permissions should be based on specific tasks, not broad job titles.', sortOrder: 3 },
          ],
        },
      ],
    },
  ],
}

// --- Collected question info for session generation ---

interface ChoiceInfo {
  id: string
  body: string
  isCorrect: boolean
  explanation: string | null
}

interface QuestionInfo {
  questionId: string
  questionSetId: string
  body: string
  explanation: string | null
  isMultiAnswer: boolean
  choices: ChoiceInfo[]
}

// --- Session seed definitions ---
// Each entry generates one completed session.
// correctRate: approximate fraction of questions answered correctly.

const sessionDefs = [
  // SAA Networking — 3 attempts showing improvement
  { qsId: qsNetworking, mode: 'practice' as const, daysAgo: 28, correctRate: 0.33 },
  { qsId: qsNetworking, mode: 'exam' as const, daysAgo: 18, correctRate: 0.67 },
  { qsId: qsNetworking, mode: 'practice' as const, daysAgo: 5, correctRate: 1.0 },

  // SAA Compute & Storage — 2 attempts
  { qsId: qsComputeStorage, mode: 'exam' as const, daysAgo: 25, correctRate: 0.5 },
  { qsId: qsComputeStorage, mode: 'practice' as const, daysAgo: 12, correctRate: 0.75 },

  // SAA Architecture & Design — 2 attempts
  { qsId: qsArchDesign, mode: 'practice' as const, daysAgo: 22, correctRate: 0.33 },
  { qsId: qsArchDesign, mode: 'exam' as const, daysAgo: 8, correctRate: 0.67 },

  // AP Security — weak area (low scores)
  { qsId: qsSecurity, mode: 'practice' as const, daysAgo: 20, correctRate: 0.33 },
  { qsId: qsSecurity, mode: 'exam' as const, daysAgo: 10, correctRate: 0.33 },

  // AP Network Tech — moderate
  { qsId: qsNetworkTech, mode: 'practice' as const, daysAgo: 15, correctRate: 0.67 },
  { qsId: qsNetworkTech, mode: 'exam' as const, daysAgo: 3, correctRate: 1.0 },

  // CLF Cloud Concepts — strong
  { qsId: qsCloudConcepts, mode: 'practice' as const, daysAgo: 14, correctRate: 1.0 },
  { qsId: qsCloudConcepts, mode: 'exam' as const, daysAgo: 2, correctRate: 0.67 },

  // CLF Security & Compliance — recent
  { qsId: qsSecCompliance, mode: 'practice' as const, daysAgo: 6, correctRate: 0.67 },
  { qsId: qsSecCompliance, mode: 'exam' as const, daysAgo: 1, correctRate: 1.0 },
]

function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// --- Insertion Logic ---

interface Env {
  DB: D1Database
}

async function main() {
  const seedUserId =
    process.argv.find((a) => a.startsWith('--user-id='))?.split('=')[1]
    ?? process.env.SEED_USER_ID
    ?? null

  if (!seedUserId) {
    console.error('Error: --user-id=<clerk_user_id> or SEED_USER_ID env is required')
    process.exit(1)
  }

  const { env, dispose } = await getPlatformProxy<Env>()
  const db = createDb(env.DB)

  try {
    // Delete in reverse dependency order for idempotency
    await db.delete(schema.questionConfidence).run()
    await db.delete(schema.sessionAnswerChoices).run()
    await db.delete(schema.sessionAnswers).run()
    await db.delete(schema.examSessions).run()
    await db.delete(schema.choices).run()
    await db.delete(schema.questionTags).run()
    await db.delete(schema.questions).run()
    await db.delete(schema.questionSetTags).run()
    await db.delete(schema.questionSets).run()
    await db.delete(schema.tags).run()
    await db.delete(schema.categories).run()

    // Insert categories
    await db.insert(schema.categories).values(
      seedData.categories.map((c) => ({ ...c, userId: seedUserId })),
    ).run()

    // Insert tags
    await db.insert(schema.tags).values(
      seedData.tags.map((t) => ({ ...t, userId: seedUserId })),
    ).run()

    let totalQuestions = 0
    const questionsBySet = new Map<string, QuestionInfo[]>()

    for (const qs of seedData.questionSets) {
      // Insert question set
      await db.insert(schema.questionSets).values({ ...qs.set, userId: seedUserId }).run()

      // Insert question set tags
      if (qs.tagIds.length > 0) {
        await db.insert(schema.questionSetTags).values(
          qs.tagIds.map((tagId) => ({ questionSetId: qs.set.id, tagId }))
        ).run()
      }

      const setQuestions: QuestionInfo[] = []

      for (const q of qs.questions) {
        const { choices: choiceData, tagIds: qTagIds, ...questionFields } = q

        // Insert question
        await db.insert(schema.questions).values({
          ...questionFields,
          questionSetId: qs.set.id,
          version: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        }).run()

        totalQuestions++

        // Insert question tags
        if (qTagIds.length > 0) {
          await db.insert(schema.questionTags).values(
            qTagIds.map((tagId) => ({ questionId: q.id, tagId }))
          ).run()
        }

        // Pre-generate choice IDs and insert
        const choicesWithIds = choiceData.map((c) => ({
          id: id(),
          questionId: q.id,
          body: c.body,
          isCorrect: c.isCorrect,
          explanation: c.explanation,
          sortOrder: c.sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        }))

        await db.insert(schema.choices).values(choicesWithIds).run()

        setQuestions.push({
          questionId: q.id,
          questionSetId: qs.set.id,
          body: q.body,
          explanation: q.explanation ?? null,
          isMultiAnswer: q.isMultiAnswer,
          choices: choicesWithIds.map((c) => ({
            id: c.id,
            body: c.body,
            isCorrect: c.isCorrect,
            explanation: c.explanation,
          })),
        })
      }

      questionsBySet.set(qs.set.id, setQuestions)
    }

    // --- Insert exam sessions & answers ---
    let totalSessions = 0

    if (seedUserId) {
      for (const def of sessionDefs) {
        const questions = questionsBySet.get(def.qsId)
        if (!questions || questions.length === 0) continue

        const sessionId = id()
        const startedAt = daysAgoISO(def.daysAgo)
        const totalQs = questions.length
        const timePerQ = 20 + Math.floor(Math.random() * 40) // 20-60s per question

        // Decide which questions are answered correctly
        const correctCount = Math.round(totalQs * def.correctRate)
        const correctFlags = questions.map((_, i) => i < correctCount)
        // Shuffle to randomise which are correct
        for (let i = correctFlags.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[correctFlags[i], correctFlags[j]] = [correctFlags[j], correctFlags[i]]
        }

        const scorePercent = Math.round((correctCount / totalQs) * 100)
        const totalTime = totalQs * timePerQ

        await db.insert(schema.examSessions).values({
          id: sessionId,
          userId: seedUserId,
          questionSetId: def.qsId,
          mode: def.mode,
          status: 'completed',
          questionOrder: JSON.stringify(questions.map((q) => q.questionId)),
          totalQuestions: totalQs,
          correctCount,
          scorePercent,
          startedAt,
          completedAt: new Date(new Date(startedAt).getTime() + totalTime * 1000).toISOString(),
          timeSpentSec: totalTime,
        }).run()

        const answerValues = questions.map((q, i) => {
          const isCorrect = correctFlags[i]
          const correctChoice = q.choices.find((c) => c.isCorrect)
          const wrongChoice = q.choices.find((c) => !c.isCorrect)
          const selectedChoice = isCorrect ? correctChoice : wrongChoice

          return {
            id: id(),
            sessionId,
            questionId: q.questionId,
            choiceOrder: JSON.stringify(q.choices.map((c) => c.id)),
            isCorrect,
            isFlagged: false,
            questionVersion: 1,
            questionSnapshot: JSON.stringify({
              body: q.body,
              explanation: q.explanation,
              isMultiAnswer: q.isMultiAnswer,
              choices: q.choices.map((c) => ({
                id: c.id,
                body: c.body,
                isCorrect: c.isCorrect,
                explanation: c.explanation,
              })),
            }),
            timeSpentSec: timePerQ + Math.floor(Math.random() * 20) - 10,
            answeredAt: startedAt,
          }
        })

        await db.insert(schema.sessionAnswers).values(answerValues).run()

        // Insert answer choices
        const answerChoiceValues = answerValues.flatMap((a, i) => {
          const q = questions[i]
          const isCorrect = correctFlags[i]
          const chosen = isCorrect
            ? q.choices.filter((c) => c.isCorrect)
            : [q.choices.find((c) => !c.isCorrect)!]
          return chosen.map((c) => ({
            sessionAnswerId: a.id,
            choiceId: c.id,
          }))
        })

        await db.insert(schema.sessionAnswerChoices).values(answerChoiceValues).run()

        totalSessions++
      }
    }

    console.info('Seed completed successfully.')
    console.info(`  Categories: ${seedData.categories.length}`)
    console.info(`  Tags: ${seedData.tags.length}`)
    console.info(`  Question Sets: ${seedData.questionSets.length}`)
    console.info(`  Questions: ${totalQuestions}`)
    console.info(`  Sessions: ${totalSessions} (userId: ${seedUserId})`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('FOREIGN KEY')) {
      console.error('Seed failed due to foreign key constraints.')
      console.error('Existing session data may reference old questions.')
      console.error('Try resetting the local DB: pnpm db:migrate:local -- --reset')
    }
    throw error
  } finally {
    await dispose()
  }
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
