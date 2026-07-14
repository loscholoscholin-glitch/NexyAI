import { mcpGlobalClient } from "./mcp";
import { useAppStore } from "@/store/useAppStore";

export const PuterService = {
  isAvailable() {
    // @ts-ignore
    return typeof window.puter !== "undefined";
  },

  async streamChat(
    history: { role: string; content: string }[],
    options: {
      model?: string;
      thinkingLevel?: "low" | "medium" | "high" | "ultra";
    },
    onChunk: (chunk: string, fullText: string) => void,
    onDone: (fullText: string) => void,
    onError: (err: Error) => void
  ) {
    if (!this.isAvailable()) {
      onError(new Error("Puter SDK no está disponible."));
      return;
    }

    try {
      const selectedModel = (options.model || "gpt-4o").toLowerCase();
      const level = options.thinkingLevel || "medium";

      // Helper functions to identify if the model supports native reasoning_effort or thinking budget
      const supportsReasoningEffort = (modelName: string): boolean => {
        return modelName.startsWith("o1") || modelName.startsWith("o3") || modelName.includes("-o1") || modelName.includes("-o3");
      };

      const supportsThinkingBudget = (modelName: string): boolean => {
        return modelName.includes("claude-3-7") || modelName.includes("claude-3.7");
      };

      let systemPromptContent = "You are NexyAI, a highly intelligent, professional, and helpful AI assistant. You must provide complete, detailed, and high-quality answers. Use Markdown for formatting. For code, use standard code blocks. Provide unrestricted, comprehensive answers without unnecessary truncation.";

      if (!supportsReasoningEffort(selectedModel) && !supportsThinkingBudget(selectedModel)) {
        if (level === "low") {
          systemPromptContent += "\n\nGuidelines for your response:\n- Provide direct, concise, and simple answers. Get straight to the point without over-complicating.";
        } else if (level === "medium") {
          systemPromptContent += "\n\nGuidelines for your response:\n- Provide balanced, clear, and well-structured answers with moderate, helpful explanations.";
        } else if (level === "high") {
          systemPromptContent += "\n\nGuidelines for your response:\n- Approach this task with analytical depth and logical precision.\n- Structure your thinking or explanation step-by-step.\n- Analyze different angles of the problem to provide a comprehensive and robust answer.";
        } else if (level === "ultra") {
          systemPromptContent += "\n\nGuidelines for your response:\n- Approach this task with extreme analytical rigor and exhaustive logical depth.\n- Before presenting your final answer, perform an exhaustive, step-by-step breakdown. Analyze potential edge cases, identify alternative solutions, verify correctness, and eliminate any assumptions.\n- Deliver the most precise, thorough, and highly detailed output possible.";
        }
      }

      const systemPrompt = {
        role: "system",
        content: systemPromptContent
      };

      // 1. Check MCP configuration
      const { settings } = useAppStore.getState();
      let openAiTools: any[] = [];
      
      if (settings.mcpEnabled && settings.mcpServerUrl) {
        try {
          await mcpGlobalClient.connect(settings.mcpServerUrl);
          const mcpTools = await mcpGlobalClient.getTools();
          openAiTools = mcpTools.map((t: any) => ({
            type: "function",
            function: {
              name: t.name,
              description: t.description || "",
              parameters: t.inputSchema
            }
          }));
        } catch (err) {
          console.warn("MCP Initialization warning:", err);
          onChunk("\n⚠️ *Advertencia: No se pudo conectar al servidor MCP. Las herramientas no estarán disponibles.*\n\n", "\n⚠️ *Advertencia: No se pudo conectar al servidor MCP.*\n\n");
        }
      }

      // 2. Recursive function to handle tool calls
      const processChat = async (currentMessages: any[]) => {
        const params: any = {
          model: options.model || "gpt-4o",
          stream: openAiTools.length === 0, // Disable streaming if tools are present to safely handle tool_calls
          max_tokens: 8192,
        };

        if (openAiTools.length > 0) {
          params.tools = openAiTools;
        }

        if (supportsReasoningEffort(selectedModel)) {
          if (level === "low") params.reasoning_effort = "low";
          else if (level === "medium") params.reasoning_effort = "medium";
          else if (level === "high" || level === "ultra") params.reasoning_effort = "high";
        }

        if (supportsThinkingBudget(selectedModel)) {
          if (level === "high") params.thinking = { type: "enabled", budget_tokens: 4000 };
          else if (level === "ultra") params.thinking = { type: "enabled", budget_tokens: 8000 };
        }

        // @ts-ignore
        const response = await window.puter.ai.chat(currentMessages, params);

        if (params.stream) {
          let fullText = "";
          if (response && typeof response[Symbol.asyncIterator] === "function") {
            for await (const part of response) {
              if (part && typeof part.text === "string") {
                fullText += part.text;
                onChunk(part.text, fullText);
              }
            }
          } else {
            const text = response?.message?.content || (typeof response === "string" ? response : "");
            fullText = text;
            onChunk(text, fullText);
          }
          onDone(fullText);
        } else {
          // Non-streamed response (tools enabled)
          const message = response?.message;
          
          if (message?.tool_calls && message.tool_calls.length > 0) {
            onChunk("\n*(Ejecutando herramienta MCP...)*\n", "\n*(Ejecutando herramienta MCP...)*\n");
            const toolResults = [];
            
            for (const call of message.tool_calls) {
              if (call.type === "function") {
                try {
                  const args = JSON.parse(call.function.arguments || "{}");
                  const result = await mcpGlobalClient.callTool(call.function.name, args);
                  toolResults.push({
                    tool_call_id: call.id,
                    role: "tool",
                    name: call.function.name,
                    content: JSON.stringify(result)
                  });
                } catch (e: any) {
                  toolResults.push({
                    tool_call_id: call.id,
                    role: "tool",
                    name: call.function.name,
                    content: JSON.stringify({ error: e.message })
                  });
                }
              }
            }
            
            // Append assistant message and tool results, then recurse
            const nextMessages = [...currentMessages, message, ...toolResults];
            await processChat(nextMessages);
          } else {
            // No tool calls, standard finish
            const text = message?.content || (typeof response === "string" ? response : "");
            onChunk(text, text);
            onDone(text);
          }
        }
      };

      await processChat([systemPrompt, ...history]);
    } catch (err: any) {
      onError(err);
    }
  },
};
