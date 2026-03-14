import { generateUlid } from '../lib/ulid'
import { now } from '../lib/timestamp'

const timestamp = now()

function id() {
  return generateUlid()
}

const networkTag = id()
const securityTag = id()
const computeTag = id()
const storageTag = id()
const databaseTag = id()

export const seedData = {
  categories: [
    {
      id: id(),
      name: 'AWS Solutions Architect Associate',
      slug: 'aws-saa',
      description: 'AWS SAA-C03 certification exam preparation',
      passScore: 72,
      sortOrder: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: id(),
      name: '応用情報技術者試験',
      slug: 'ap',
      description: 'IPA 応用情報技術者試験対策',
      passScore: 60,
      sortOrder: 1,
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
  ],
  questionSets: [
    {
      set: {
        id: id(),
        categoryId: '', // filled below
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
  ],
}

// Wire up category IDs
seedData.questionSets[0].set.categoryId = seedData.categories[0].id
