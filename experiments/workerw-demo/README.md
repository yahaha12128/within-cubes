# WorkerW 桌面层嵌入 Demo（Phase 1）

这是一个完全独立的可行性 Demo，只验证 Win32 桌面层级嵌入，不包含任何业务逻辑，也没有被 `main.js` 或现有 `src/` 模块引用。现有悬浮窗方案和主代码保持不变。

## 结论（2026-10-20）

在本机 **Windows 10 Pro 22H2 (10.0.19045)**、Electron 44.9.0、koffi 3.3.3 上，Phase 1 的四项验收全部通过：

| 验收项 | 实测结果 |
|---|---|
| 找到包含 `SHELLDLL_DefView` 的桌面宿主 | `WorkerW 0x101D8`，`SHELLDLL_DefView = 0x101B2` |
| `SetParent` 成为桌面子窗口 | 父窗口为 `WorkerW 0x101D8`，样式含 `WS_CHILD`，不含 `WS_POPUP` |
| 处在壁纸之上、普通应用之下 | 桌面“显示桌面”时可见；普通应用窗口会覆盖它 |
| 真实 `Win + D` 不隐藏 | 用真实键盘事件触发两次 Win+D，面板保持可见，点击计数也保留 |
| HTML 按钮可被真实鼠标点击 | `SetCursorPos + mouse_event` 点击后计数从 0 → 1；Win+D 后再点到 2 |

关键日志：

```text
Desktop host: WorkerW 0x101D8
SHELLDLL_DefView: 0x101B2
after.parent: 0x101D8
after.parentClass: WorkerW
after.isChildStyle: true
after.isPopupStyle: false
after.isClickThroughStyle: false
Pointer event from renderer: {"kind":"button-click","count":1}
```

> 本次实测还发现：这台机器上常规窗口（浏览器、终端）会正常覆盖 Demo 面板；恢复窗口后 Demo 仍在桌面层，未影响已有业务进程。

## 启动

从项目根目录打开 PowerShell：

```powershell
.\node_modules\.bin\electron.cmd .\experiments\workerw-demo
```

或：

```powershell
npx electron .\experiments\workerw-demo
```

启动后 Demo 会把自身嵌入主屏左上区域。若被普通窗口挡住，可按 `Win + D` 或最小化挡住的窗口。

关闭方式：

- 点击面板里的「关闭 Demo」。
- 面板可交互时按 `Esc`。
- 或关闭启动它的终端进程。

主进程日志会直接输出到启动终端。

## 手工验收步骤

1. **鼠标链路**：点击「点击测试」，计数应增加，且下方出现「鼠标点击链路正常」。主进程日志应出现 `button-click`。
2. **层级**：打开任意普通应用窗口，拖到面板上方。普通应用必须覆盖 Demo；Demo 不应盖住普通应用。
3. **Win + D**：按一次 Win+D。普通窗口隐藏，Demo 应仍贴在桌面；再按一次 Win+D 恢复普通窗口。
4. **诊断状态**：页面顶部应显示「已嵌入桌面层」，`WS_CHILD ✓`，鼠标穿透为「未启用」。

## Demo 文件

| 文件 | 作用 |
|---|---|
| `win32.js` | koffi 绑定、`FindWorkerW`、`SetParent`、样式转换、坐标转换、原生诊断 |
| `main.js` | 创建透明无边框窗口、附加到 WorkerW、IPC、日志 |
| `preload.js` | 最小 contextBridge API |
| `index.html` / `styles.css` / `renderer.js` | 测试面板与鼠标点击验证 |
| `win32.test.js` | WorkerW 发现、Progman 回退、0x052C 重扫、样式转换的单元测试 |
| `package.json` | Demo 独立清单，仅用于显式启动 |

运行单元测试：

```powershell
node --test .\experiments\workerw-demo\win32.test.js
```

或：

```powershell
npm test --prefix .\experiments\workerw-demo
```

## 实现要点

### 1. 宿主发现

`win32.js` 的 `findWorkerW()`：

1. 用 `FindWindowW("Progman", null)` 找到 Progman。
2. 用 `FindWindowExW(0, after, "WorkerW", null)` 遍历所有顶层 `WorkerW`。
3. 对每个候选调用 `FindWindowExW(worker, 0, "SHELLDLL_DefView", null)`。
4. 优先选择包含 `SHELLDLL_DefView` 的 `WorkerW`；如果图标视图直接挂在 Progman 下，则回退到 Progman。
5. 两者都不存在时，向 Progman 发送 `0x052C`（`SendMessageW`），再扫描一次。

宿主选择的依据是「包含 `SHELLDLL_DefView`」，不是简单选择第一个 WorkerW，也不是选择壁纸 WorkerW。

### 2. 原生窗口转成桌面子窗口

Electron 拿到的 HWND 是一个顶层窗口。Demo 依次执行：

1. 读取并保存原样式。
2. 清除 `WS_POPUP`，设置 `WS_CHILD | WS_VISIBLE`。
3. 清除 `WS_EX_APPWINDOW` 与 `WS_EX_TRANSPARENT`，设置 `WS_EX_TOOLWINDOW`。
4. `SetParent(hwnd, workerW)`，并立即用 `GetParent` 校验，失败就显式报错。
5. 用 `GetWindowRect` + `ScreenToClient` 把原来的屏幕坐标转换成 WorkerW 客户区坐标。
6. `SetWindowPos(hwnd, HWND_TOP, ..., SWP_NOACTIVATE | SWP_FRAMECHANGED | SWP_SHOWWINDOW)`。

`WS_POPUP` 与 `WS_CHILD` 不能同时存在；`SetParent` 本身不会自动改样式，因此必须显式转换。

### 3. Win + D 不隐藏

窗口成为 `WorkerW` 的 Win32 子窗口后，不再属于顶层应用窗口集合。Win+D 隐藏的是顶层窗口；桌面 `WorkerW` 本身仍然存在，因此子窗口也会保留。

这不是靠拦截 Win+D、定时重新显示或 `alwaysOnTop` 实现的。

### 4. 鼠标穿透

Demo **没有**：

- 设置 `WS_EX_TRANSPARENT`；
- 调用 `win.setIgnoreMouseEvents(true)` 或 `setIgnoreMouseEvents(true, { forward: true })`。

并且主动确认并移除了 `WS_EX_TRANSPARENT`。因此鼠标事件可以到达 Chromium，HTML 按钮能收到真实的 Win32 鼠标点击。

注意：当前 Demo 的整个透明窗口矩形都会接收鼠标。空白的透明区域默认也不会穿透到桌面图标；如果 Phase 2 需要“只有卡片区域可点、透明区域穿透”，需要另行设计基于鼠标位置的动态命中策略。

## Phase 2 前必须注意

1. **只验证了 Windows 10 22H2**。Windows 11 24H2/25H2 的桌面结构已经把 `SHELLDLL_DefView` 和 WorkerW 的组织方式改掉，不能直接照搬本 Demo，必须另做兼容分支。
2. **Explorer 重启会销毁/重建 WorkerW**。生产实现必须监听并重新发现宿主、重新挂载；当前 Demo 没有做自动恢复。
3. **多显示器/DPI** 目前只做了坐标换算的基础处理，未系统验证 125%/150%/多屏负坐标和跨屏拖动。
4. **窗口生命周期**：从顶层窗口变成子窗口后，不要再把它当成普通窗口参与最小化、任务栏、全屏避让等逻辑。主设置窗口必须继续使用普通窗口，只有桌面小组件窗口可以嵌入。
5. **焦点行为**：当前 Demo 未设置 `WS_EX_NOACTIVATE`，点击会走默认激活流程；Phase 2 需要决定点击小组件是否应抢焦点，并单独验证键盘、拖拽和输入法。
6. **桌面图标层级**：目标是 `WorkerW` 图标宿主，窗口在其内部通过 `HWND_TOP` 置顶，因此处于该宿主内图标视图的上方。当前应用默认隐藏桌面图标，影响较小；如果未来要同时显示系统图标，需要重新确认叠放顺序。
7. **系统兼容风险**：`SetParent` 到 Explorer 窗口属于未公开/不受支持的桌面技巧，Windows 更新、第三方桌面整理器、Wallpaper Engine 等都可能改变行为。Phase 2 必须把这部分隔离在独立模块中，并保留回退到普通悬浮窗的开关。
8. **第三方覆盖层**：本机存在 Wallpaper Engine 与 `TXMiniSkin` 窗口，本次仍能正常工作；生产实现不能假设桌面层级永远固定。

## 参考

- [Electron: Custom Window Interactions](https://www.electronjs.org/docs/latest/tutorial/custom-window-interactions)
- [FeatherWall architecture（Windows 11 24H2+ 桌面结构）](https://raw.githubusercontent.com/RitvikDayal/featherwall/main/docs/architecture.md)
- [AutoHotkey: desktop gadgets and Win+D](https://www.autohotkey.com/boards/viewtopic.php?f=82&t=131972)
- [tauri-plugin-desktop-underlay Windows implementation](https://raw.githubusercontent.com/Charlie-XIAO/tauri-plugin-desktop-underlay/main/src/core/windows.rs)
