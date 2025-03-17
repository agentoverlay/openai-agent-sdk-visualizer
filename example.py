"""
Example OpenAI Agents SDK file for testing the visualizer.
This file demonstrates various Agents SDK patterns that should be detected.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from agents import Agent, function_tool, RunContextWrapper, handoff, Guardrail

# Define a context model
class TaskContext(BaseModel):
    """Context for tracking task information across agents"""
    task_id: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[int] = None
    metadata: Optional[Dict] = None

# Define tools
@function_tool
async def create_task(context: RunContextWrapper[TaskContext], title: str, description: str) -> str:
    """
    Create a new task in the system
    
    Args:
        title: The title of the task
        description: A detailed description of the task
    """
    # In a real implementation, this would create a task in a database
    task_id = "TASK-123"  # Would be generated in real implementation
    
    # Update context
    context.context.task_id = task_id
    context.context.status = "created"
    
    return f"Task created with ID: {task_id}"

@function_tool
async def assign_task(context: RunContextWrapper[TaskContext], user_id: str) -> str:
    """
    Assign a task to a user
    
    Args:
        user_id: The ID of the user to assign the task to
    """
    # Check if we have a task in context
    if not context.context.task_id:
        return "No active task found in context"
    
    # In a real implementation, this would update a task in a database
    context.context.assigned_to = user_id
    context.context.status = "assigned"
    
    return f"Task {context.context.task_id} assigned to user {user_id}"

@function_tool
async def complete_task(context: RunContextWrapper[TaskContext]) -> str:
    """
    Mark a task as complete
    """
    # Check if we have a task in context
    if not context.context.task_id:
        return "No active task found in context"
    
    # In a real implementation, this would update a task in a database
    context.context.status = "completed"
    
    return f"Task {context.context.task_id} marked as completed"

@function_tool
async def search_knowledge_base(query: str) -> str:
    """
    Search the knowledge base for information
    
    Args:
        query: The search query
    """
    # In a real implementation, this would search a knowledge base
    return f"Results for query '{query}': Found 3 relevant articles"

# Define guardrails
sensitive_info_guardrail = Guardrail(
    name="Sensitive Information Guardrail",
    description="Prevents exposure of sensitive information in responses",
)

# Define agents
task_creation_agent = Agent[TaskContext](
    name="Task Creation Agent",
    instructions="""You are a task creation agent. You help users create new tasks in the system.
    
    When a user wants to create a task:
    1. Ask for a title and description if not provided
    2. Use the create_task tool to create the task
    3. Confirm to the user that the task was created
    """,
    tools=[create_task],
    guardrails=[sensitive_info_guardrail],
)

task_assignment_agent = Agent[TaskContext](
    name="Task Assignment Agent",
    instructions="""You are a task assignment agent. You help users assign tasks to team members.
    
    When a user wants to assign a task:
    1. If there's no active task in context, ask them to specify which task to assign
    2. Ask for the user ID to assign the task to if not provided
    3. Use the assign_task tool to assign the task
    4. Confirm to the user that the task was assigned
    """,
    tools=[assign_task],
    guardrails=[sensitive_info_guardrail],
)

task_completion_agent = Agent[TaskContext](
    name="Task Completion Agent",
    instructions="""You are a task completion agent. You help users mark tasks as complete.
    
    When a user wants to complete a task:
    1. If there's no active task in context, ask them to specify which task to complete
    2. Use the complete_task tool to mark the task as completed
    3. Confirm to the user that the task was marked as completed
    """,
    tools=[complete_task],
    guardrails=[sensitive_info_guardrail],
)

knowledge_base_agent = Agent[TaskContext](
    name="Knowledge Base Agent",
    instructions="""You are a knowledge base agent. You help users find information in the knowledge base.
    
    When a user is looking for information:
    1. Extract the search query from their request
    2. Use the search_knowledge_base tool to find relevant information
    3. Present the results to the user in a clear format
    """,
    tools=[search_knowledge_base],
    guardrails=[sensitive_info_guardrail],
)

# Main triage agent
triage_agent = Agent[TaskContext](
    name="Task Management Triage Agent",
    instructions="""You are a task management triage agent. You help direct users to the appropriate specialized agent.
    
    Analyze the user's request and determine which specialized agent would be best equipped to handle it:
    - For creating tasks, hand off to the Task Creation Agent
    - For assigning tasks, hand off to the Task Assignment Agent
    - For completing tasks, hand off to the Task Completion Agent
    - For knowledge base queries, hand off to the Knowledge Base Agent
    
    Ask clarifying questions if the user's request is ambiguous.
    """,
    handoffs=[
        task_creation_agent,
        task_assignment_agent,
        task_completion_agent,
        knowledge_base_agent,
    ],
    guardrails=[sensitive_info_guardrail],
)

# Set up cross-handoffs
task_creation_agent.handoffs = [triage_agent, task_assignment_agent]
task_assignment_agent.handoffs = [triage_agent, task_completion_agent]
task_completion_agent.handoffs = [triage_agent]
knowledge_base_agent.handoffs = [triage_agent]
