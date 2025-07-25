# 智能语音记账App

一款功能完整的移动端语音记账应用，支持语音输入、手动记账、数据统计和分类管理。

## 功能特性

### 📝 记账功能
- **语音输入**: 支持语音录制（可扩展语音识别API）
- **手动输入**: 完整的表单输入，包含金额、标题、分类和时间
- **实时统计**: 显示本月支出总额和今日记录

### 📊 统计分析
- **多时间维度**: 支持月、季、年统计切换
- **趋势分析**: 最近6个月支出趋势图
- **分类分布**: 按分类显示支出占比和金额

### 📚 历史记录
- **按日分组**: 清晰的日期分组显示
- **详细信息**: 每笔记录包含时间、分类、金额等完整信息
- **累计统计**: 显示总记录数和累计支出

### ⚙️ 设置管理
- **分类管理**: 完整的CRUD操作，支持自定义图标和颜色
- **数据管理**: CSV数据导出和数据清除功能
- **应用信息**: 显示版本、存储方式等信息

## 技术栈

- **框架**: Next.js 14 + React 18
- **UI组件**: shadcn/ui + Radix UI
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **数据存储**: LocalStorage
- **类型检查**: TypeScript

## 快速开始

### 本地开发

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
\`\`\`

### Docker部署

\`\`\`bash
# 构建镜像
docker build -t voice-accounting-app .

# 运行容器
docker run -p 3000:3000 voice-accounting-app

# 或使用 docker-compose
docker-compose up -d
\`\`\`

### Vercel部署

1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. 自动部署完成

或使用GitHub Actions自动部署：
1. 设置Vercel Token和项目ID
2. 推送代码到main分支
3. 自动触发部署流程

## 项目结构

\`\`\`
voice-accounting-app/
├── app/
│   ├── page.tsx          # 主应用组件
│   ├── layout.tsx        # 布局组件
│   └── globals.css       # 全局样式
├── components/
│   └── ui/              # UI组件库
├── hooks/               # 自定义Hooks
├── lib/                 # 工具函数
├── public/              # 静态资源
├── next.config.js       # Next.js配置
├── package.json         # 项目依赖
├── Dockerfile          # Docker配置
├── docker-compose.yml  # Docker Compose配置
└── vercel.json         # Vercel部署配置
\`\`\`

## 数据结构

### 支出记录 (Expense)
\`\`\`typescript
interface Expense {
  id: number
  amount: number
  title: string
  category: string
  time: string
  date: string
  timestamp: number
}
\`\`\`

### 分类 (Category)
\`\`\`typescript
interface Category {
  id: number
  name: string
  icon: string
  color: string
}
\`\`\`

## 功能扩展

### 语音识别集成
可以集成以下语音识别服务：
- Web Speech API (浏览器原生)
- 百度语音识别API
- 腾讯云语音识别
- 阿里云语音识别

### 数据同步
可以扩展以下数据同步功能：
- 云端数据备份
- 多设备同步
- 数据导入导出

### 高级统计
可以添加更多统计功能：
- 预算管理
- 支出预测
- 消费习惯分析
- 图表可视化增强

## 许可证

MIT License
