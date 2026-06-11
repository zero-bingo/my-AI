# LangChain Python 导师

一个基于阿里云百炼和 LangChain 的 Python 学习助手。

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <仓库地址>
cd langchain
```

### 2. 创建虚拟环境

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
```

### 3. 安装依赖

```bash
pip install -r requirements.txt
```

### 4. 配置环境变量

复制 `.env` 文件并配置你的阿里云百炼 API Key：

```bash
# 确保 .env 文件存在并包含以下内容：
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### 5. 运行项目

```bash
python main.py
```

## 📁 项目结构

```
langchain/
├── .env              # 环境变量配置
├── main.py           # 主程序
├── requirements.txt  # 依赖列表
├── README.md         # 项目说明
└── venv/             # 虚拟环境（无需上传）
```

## 📝 使用说明

1. 运行 `python main.py` 后，程序会提示你输入问题
2. 输入任何 Python 相关的问题，AI 会给出详细解答
3. 示例问题：
   - "什么是列表推导式？"
   - "如何用 Python 实现快速排序？"
   - "装饰器的作用是什么？"

## 🔧 技术栈

- Python 3.14+
- LangChain 1.3.7
- 阿里云百炼 (通义千问)

## 📌 注意事项

- 请确保已开通阿里云百炼服务
- API Key 请妥善保管，不要提交到 Git
- 建议使用虚拟环境隔离依赖
