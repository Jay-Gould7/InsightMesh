# InsightMesh MVP 总路线

## Summary
- 目标是交付一个黑客松可演示的 MVP：发起方先锁定 `USDT0` 奖池，AI 生成问卷，用户在 Core Space 以 gas-sponsored 方式提交一次反馈，AI 完成聚类和评分，发起方确认结果后由后端中继在 eSpace 发奖。
- 后续代码实现以 MVP 闭环优先，不以“完全去中心化”优先。`CrossSpaceCall` 自动桥接和链上分数锚定保留为 stretch。
- 文档职责重新收敛：`implementation_plan.md` 作为产品规格、架构、状态机和接口真源；`task.md` 只保留按依赖顺序排列的执行清单。

## Implementation Changes
- 产品状态机
  - `Bounty` 生命周期固定为 `PENDING_FUNDING -> ACTIVE -> ANALYZING -> READY_TO_SETTLE -> SETTLED | CANCELLED`。
  - 只有当 `RewardVault.deposit` 成功并被后端记录后，Bounty 才会进入 `ACTIVE` 并对外可见。
  - 最终确认人固定为 `Bounty 创建者`；发奖执行人为后端 relayer，前提是验证创建者签名。

- Core Space
  - `BountyRegistry` 只负责记录已激活 bounty 的基础信息：`creator`、`title`、`metadataHash`、`rewardAmount`、`deadline`、`submissionCount`、`status`。
  - `SubmissionRegistry` 接口固定为 `submit(bountyId, contentHash, payoutAddress)`，其中 `payoutAddress` 为提交时绑定的 eSpace 收款地址。
  - 每个地址在同一个 bounty 下只能提交一次；每个地址对同一条 submission 只能 support 一次；禁止 self-support；超过 deadline 后拒绝 submit/support。
  - Sponsor 配置不放在合约构造函数里，统一由部署后脚本完成，包括 whitelist、gas sponsorship 和余额准备。

- eSpace
  - `RewardVault` 保留两个 MVP 接口：`deposit(bountyId, amount)` 和 `distribute(bountyId, recipients, amounts)`。
  - `distribute` 仅允许 relayer/admin 调用，且每个 bounty 只能结算一次；发奖总额不得超过已存入金额。
  - MVP 固定只支持 `USDT0`，不做多币种抽象。

- Backend / AI / Data
  - 原始问卷内容和答案只存数据库，链上只存 `contentHash` 和必要元数据。
  - 数据模型增加或固定以下字段：`payoutAddress`、`vaultDepositTx`、`settlementTx`、`analysisStatus`、`settledAt`。
  - 分数模型改为整数分，不使用 `Float`；奖励计算采用确定性舍入规则，保证总额不超过奖池。
  - AI 输出固定包含：`questions[]`、`clusters[]`、`duplicates[][]`、`highlights[]`、`scoreBreakdown[]`。
  - 结算时先冻结一次评分快照，再计算收款列表和金额，随后调用 eSpace 发奖并回写数据库。

- Frontend
  - 创建流程固定为：连接 Core + eSpace 钱包 -> 存入 `USDT0` -> 创建 bounty -> 发布。
  - 提交流程固定为：连接 Core 钱包 -> 填问卷 -> 确认 eSpace 收款地址 -> gas-sponsored submit。
  - 洞察页展示聚类、去重、高价值建议和分数；仅创建者可见 `Confirm & Settle`。
  - Dashboard 以数据库为主数据源，展示我创建的 bounty、我参与的 bounty、奖励状态和交易哈希。

- 执行顺序
  - 1. 先重写两份文档，锁死状态机、接口和任务依赖。
  - 2. 搭项目骨架、Prisma、合约目录和部署脚本。
  - 3. 先做 eSpace `deposit/distribute`，确保“真钱已锁定”成立。
  - 4. 再做 Core Space 的 `create/submit/support` 和 sponsor 脚本。
  - 5. 接 AI 问卷生成、聚类和评分 API。
  - 6. 接创建者确认与后端 relayer 发奖闭环。
  - 7. 最后做可视化、seed、README 和 demo 视频素材。

## Public Interfaces / Types
- Core 合约接口
  - `createBounty(string title, string metadataHash, uint256 rewardAmount, uint256 deadline) returns (uint256 bountyId)`
  - `submit(uint256 bountyId, bytes32 contentHash, address payoutAddress)`
  - `support(uint256 bountyId, uint256 submissionId)`

- eSpace 合约接口
  - `deposit(uint256 bountyId, uint256 amount)`
  - `distribute(uint256 bountyId, address[] recipients, uint256[] amounts)`

- API 约定
  - 问卷生成接口返回带稳定 `id/type/label` 的 `questions[]`。
  - 分析接口返回 `clusters`、`duplicates`、`highlights`、`scoreBreakdown`。
  - 结算接口输入必须包含 `bountyId`、创建者签名、评分快照标识。

- 数据规则
  - 每地址每 bounty 一次提交。
  - 每条 submission 绑定一个 payout address。
  - 每地址每条 submission 一次 support。

## Test Plan
- 合约测试
  - 先 deposit 后激活 bounty，未入金 bounty 不可发布。
  - 0 CFX 账户可成功完成 sponsored submit。
  - 重复提交、重复 support、自赞、过期提交全部失败。
  - `distribute` 只能执行一次，且总额不超过已存入 `USDT0`。

- Backend / AI
  - 问卷生成返回合法 JSON 且问题类型可渲染。
  - 20+ 条 seed 反馈可稳定产出 3-5 个主题、重复组和整数分。
  - 奖金计算总额不超池子，舍入规则可复现。
  - 结算必须通过创建者签名校验。

- E2E
  - 完整跑通：创建者存奖池 -> 创建 bounty -> 多用户 gasless 提交 -> AI 分析 -> 创建者确认 -> relayer 发奖 -> 页面展示获奖结果。
  - 异常场景覆盖：sponsor 余额不足、AI 返回结构错误、relayer 交易失败、用户未提供 payout address。

## Assumptions
- MVP 采用“AI 推荐 + 创建者确认 + 后端 relayer 发奖”，不是完全 trustless 仲裁。
- `CrossSpaceCall` 自动桥接不进入第一阶段实现，只作为时间充裕时的加分项。
- `SQLite + Prisma` 足够支撑黑客松演示规模，不做数据库升级。
- `implementation_plan.md` 是规格文档，`task.md` 是执行文档；后续写代码时以这版路线为唯一总路线。
