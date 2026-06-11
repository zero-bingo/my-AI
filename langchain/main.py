import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

# 1. 加载环境变量
load_dotenv()

# 2. 初始化大模型（使用阿里云百炼）
llm = ChatOpenAI(
    model_name="qwen-turbo",  # 阿里云百炼的通义千问模型
    temperature=0.7,
    base_url=os.getenv("OPENAI_BASE_URL"),
    api_key=os.getenv("OPENAI_API_KEY")
)

# 3. 构建提示词模板
prompt = ChatPromptTemplate.from_template(
    "你是一个专业的Python导师。请用通俗易懂的语言回答用户的问题：{question}"
)

# 4. 创建对话链并执行 (使用新版 RunnableSequence 模式)
chain = prompt | llm

try:
    # 5. 获取用户输入
    user_question = input("请输入你的Python问题：")
    
    # 6. 执行对话链并打印结果
    response = chain.invoke({"question": user_question})
    print("\n" + "="*60)
    print("AI 回答：")
    print("="*60)
    print(response.content)
except Exception as e:
    print(f"请求失败: {e}")
    print("\n提示：如果遇到问题，请检查：")
    print("1. 网络连接是否正常")
    print("2. API密钥是否正确（阿里云百炼API Key）")
    print("3. 阿里云百炼服务是否已开通")
