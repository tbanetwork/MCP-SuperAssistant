// pages/content/src/utils/instructionGenerator.ts
import { jsonSchemaToCsn } from './schema_converter';
import { chatgptInstructions } from './website_specific_instruction/chatgpt';
import { geminiInstructions } from './website_specific_instruction/gemini';
import { langdockInstructions } from './website_specific_instruction/langdock'; // Neuer Import

/**
 * Generates markdown instructions for using MCP tools based on available tools
 * @param tools Array of available tools with their schemas
 * @returns Markdown formatted instructions
 */
export const generateInstructions = (tools: Array<{ name: string; schema: string; description: string }>): string => {
  if (!tools || tools.length === 0) {
    return '# No tools available\n\nConnect to the MCP server to see available tools.';
  }

  // Start with a header
  // let instructions = '# MCP Tools Instructions\n\n';
  let instructions = '';
  let compressed_schema_notation = '';

  // Add general usage information
  // instructions += '## General Usage\n\n';
  instructions +=
    `
[Start Fresh Session from here]

<SYSTEM>
You are SuperAssistant with the capabilities of invoke functions and make the best use of it during your assistance, a knowledgeable assistant focused on answering questions and providing information on any topics.
In this environment you have access to a set of tools you can use to answer the user\'s question.
You have access to a set of functions you can use to answer the user\'s question. You do NOT currently have the ability to inspect files or interact with external resources, except by invoking the below functions.

Function Call Structure:
- All function calls should be wrapped in \'xml\' codeblocks tags like \`\`\`xml ... \`\`\`. This is strict requirement.
- Wrap all function calls in \'function_calls\' tags
- Each function call uses \'invoke\' tags with a \'name\' attribute
- Parameters use \'parameter\' tags with \'name\' attributes
- Parameter Formatting:
  - String/scalar parameters: written directly as values
  - Lists/objects: must use proper JSON format
  - Required parameters must always be included
  - Optional parameters should only be included when needed
  - If there is xml inside the parameter value, do not use CDATA for wrapping it, just give the xml directly

The instructions regarding \'invoke\' specify that:
- When invoking functions, use the \'invoke\' tag with a \'name\' attribute specifying the function name.
- The invoke tag must be nested within an \'function_calls\' block.
- Parameters for the function should be included as \'parameter\' tags within the invoke tag, each with a \'name\' attribute.
- Include all required parameters for each function call, while optional parameters should only be included when necessary.
- String and scalar parameters should be specified directly as values, while lists and objects should use proper JSON format.
- Do not refer to function/tool names when speaking directly to users - focus on what I\'m doing rather than the tool I\'m using.
- When invoking a function, ensure all necessary context is provided for the function to execute properly.
- Each \'invoke\' tag should represent a single, complete function call with all its relevant parameters.
- DO not generate any <function_calls> tag in your thinking/resoning process, because those will be interpreted as a function call and executed. just formulate the correct parameters for the function call.

The instructions regarding \'call_id="$CALL_ID">
- It is a unique identifier for the function call.
- It is a number that is incremented by 1 for each new function call, starting from 1.

You can invoke one or more functions by writing a "<function_calls>" block like the following as part of your reply to the user, MAKE SURE TO INVOKE ONLY ONE FUNCTION AT A TIME, meaning only one \'<function_calls>\' tag in your output :

<Example>
\`\`\`xml
<function_calls>
<invoke name="$FUNCTION_NAME" call_id="$CALL_ID">
<parameter name="$PARAMETER_NAME_1">$PARAMETER_VALUE</parameter>
<parameter name="$PARAMETER_NAME_2">$PARAMETER_VALUE</parameter>
...
</invoke>
</function_calls>
</Example>

String and scalar parameters should be specified as is, while lists and objects should use JSON format. Note that spaces for string values are not stripped. The output is not expected to be valid XML and is parsed with regular expressions.

When a user makes a request:
1. ALWAYS analyze what function calls would be appropriate for the task
2. ALWAYS format your function call usage EXACTLY as specified in the schema
3. NEVER skip required parameters in function calls
4. NEVER invent functions that arent available to you
5. ALWAYS wait for function call execution results before continuing
6. After invoking a function, wait for the output in <function_results> tag and then continue with your response
7. NEVER invoke multiple functions in a single response
8. NEVER mock or form <function_results> on your own, it will be provided to you after the execution

Answer the user\'s request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters. Carefully analyze descriptive terms in the request as they may indicate required parameter values that should be included even if not explicitly quoted.

<Output Format>
<Start HERE>
## Thoughts
  - User Query Elaboration:
  - Thoughts:
  - Observations:
  - Solutions:
  - Function to be used:
  - call_id: $CALL_ID + 1 = $CALL_ID

\`\`\`xml
<function_calls>
<invoke name="$FUNCTION_NAME" call_id="$CALL_ID">
<parameter name="$PARAMETER_NAME_1">$PARAMETER_VALUE</parameter>
<parameter name="$PARAMETER_NAME_2">$PARAMETER_VALUE</parameter>
...
</invoke>
</function_calls>
\`\`\`
<End HERE>
</Output Format>

Do not use <Start HERE> and <End HERE> in your output, that is just output format reference to where to start and end your output.
`;

  // Add website-specific instructions based on the current site
  //# Gemini-Specific Instructions
  const currentHost = window.location.hostname;
  if (currentHost.includes('gemini')) {
    instructions += geminiInstructions;
  }

  //# ChatGPT-Specific Instructions
  if (currentHost.includes('chatgpt')) {
    instructions += chatgptInstructions;
  }

  //# LangDock-Specific Instructions
  if (currentHost.includes('langdock')) {
    instructions += langdockInstructions;
  }

  // Add a table explaining the compressed notation for schemas
  compressed_schema_notation += `## Compressed Schema Notation Documentation

The following table explains the compressed notation used in schemas:

Schema Notation Table

**Notation** | **Meaning** | **Example**
------- | -------- | --------
o | Object | o {p {name:s}}
p {} | Contains the object's properties. |
p {} | Properties block | p {name:s; age:i}
s | String | name:s
i | Integer | age:i
n | Number | score:n
b | Boolean | active:b
a | Array | tags:a[s]
e[values] | Enum | color:e["red", "green", "blue"]
u[types] | Union | value:u[s, n]
lit[value] | Literal | status:lit["active"]
r | Required | name:s r
d=value | Default value | active:b d=true
ap f | Additional properties false | o {p {name:s} ap f}
type(key=value, ...) | Constrained type | name:s(minLength=1)
a[type] | Array with item type | tags:a[s]
o {p {prop:type}} | Nested object | user:o {p {id:i; name:s}}
?type | Optional type | ?s
t[type1, type2, ...] | Tuple | t[s, i]
s[type] | Set | s[i]
d[key, value] | Dictionary | d[s, i]
ClassName | Custom class | User

`;

  // Add available tools section
  instructions += '## AVAILABLE TOOLS FOR SUPERASSISTANT\n\n';

  // Add each tool with its schema
  tools.forEach(tool => {
    instructions += ` - ${tool.name}\n`;

    try {
      // Parse the schema to get more details
      const schema = JSON.parse(tool.schema);

      // Add description if available
      if (tool.description) {
        instructions += `**Description**: ${tool.description}\n`;
      }

      // // Add parameters if available
      if (schema.properties && Object.keys(schema.properties).length > 0) {
        instructions += '**Parameters**:\n';

        const requiredParams = Array.isArray(schema.required) ? schema.required : [];
        Object.entries(schema.properties).forEach(([paramName, paramDetails]: [string, any]) => {
          const isRequired = requiredParams.includes(paramName);
          instructions += `- \`${paramName}\`: ${paramDetails.description ? paramDetails.description : ''} (${paramDetails.type || 'any'}) (${isRequired ? 'required' : 'optional'})\n`;

          // Handle nested objects
          if (paramDetails.type === 'object' && paramDetails.properties) {
            instructions += '  - Properties:\n';
            Object.entries(paramDetails.properties).forEach(([nestedName, nestedDetails]: [string, any]) => {
              instructions += `    - \`${nestedName}\`: ${nestedDetails.description || 'No description'} (${nestedDetails.type || 'any'})\n`;
            });
          }

          // Handle arrays with object items
          if (
            paramDetails.type === 'array' &&
            paramDetails.items &&
            paramDetails.items.type === 'object' &&
            paramDetails.items.properties
          ) {
            instructions += '  - Array items (objects) with properties:\n';
            Object.entries(paramDetails.items.properties).forEach(([itemName, itemDetails]: [string, any]) => {
              instructions += `    - \`${itemName}\`: ${itemDetails.description || 'No description'} (${itemDetails.type || 'any'})\n`;
            });
          }
        });

        instructions += '\n';
      }
    } catch (error) {
      // If schema parsing fails, provide a simpler example
      instructions += 'Schema information not available. No Tools Available';
    }
  });

  instructions += '<\\SYSTEM>';

  instructions += '\n\n';
  instructions += '\n\n';
  instructions += 'User Interaction Starts here:';
  instructions += '\n\n\n';
  instructions += '\n\n';
  instructions += '\n\n';
  instructions += '\n\n';
  return instructions;
};
