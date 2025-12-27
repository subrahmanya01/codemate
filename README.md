# Codemate ToolKit

Codemate Toolkit is a lightweight Visual Studio Code extension that provides essential utility tools for developers. 

## Tools
### 🚀Base 64 Helper
A Base64 utility for quickly encoding and decoding strings.

![Base 64 Helper Tool](./docs/images/base64Tool.png)

### 🚀 JSON to Code Generator

Stop writing boilerplate. Instantly generate strongly-typed models, classes, and structs from your JSON objects.

![Base 64 Helper Tool](./docs/images/jsonToCode.png)

**JSON to Code** allows you to paste a JSON object and automatically converts it into a ready-to-use class or struct in your language of choice. It infers data types, handles nesting, and produces clean, syntax-highlighted code.

#### ✨ Key Features

* **Instant Conversion:** Zero latency; get your code immediately.
* **Deep Nesting Support:** Automatically generates helper classes for nested JSON objects.
* **Type Inference:** Smartly detects integers, floats, booleans, strings, and nullables.

#### 🛠 Supported Languages

Currently, the tool supports conversion to the following languages:

| Language | Output Format |
| :--- | :--- |
| **TypeScript** | Interfaces / Types |
| **JavaScript** | ES6 Classes / Proptypes |
| **C#** | Classes with Properties |
| **Java** | POJO Classes |
| **Python** | Dataclasses / Pydantic models |
| **Go** | Structs with JSON tags |
| **Kotlin** | Data Classes |
| **Ruby** | Classes / Hash initializers |

#### Usage

1.  Paste your raw JSON into the input editor.
2.  Select your target language from the dropdown.
3.  Copy the generated code and use it in your project!


## Contributing

Contributions are welcome. Open issues or pull requests with a clear description and tests for behavior changes.

## License

MIT
