# 交通补贴计算逻辑更新

## 更新日期
2025-01-14

## 更新内容

将交通补贴的计算逻辑从**固定金额**改为**按工作日天数计算**。

## 修改说明

### 原逻辑
- 交通补贴是一个固定金额，无论出勤天数多少，都加到工资中
- 公式：`总工资 = 基本工资 + 加班费 + 交通补贴（固定） + 奖金 - 扣除项`

### 新逻辑
- 交通补贴按每日金额 × 实际出勤天数计算
- **只有工作日有补贴，休息日没有补贴**
- 公式：`总工资 = 基本工资 + 加班费 + (每日交通补贴 × 出勤天数) + 奖金 - 扣除项`

## 修改的文件

### 1. `admin/src/views/SalaryView.tsx`

#### 数据加载时的计算
```typescript
// 修改前
const currentTransportFee = settings ? settings.transport_fee : transportFee;
const grossSalary = (normalHours * currentHourlyRate) + (overtimeHours * currentOvertimeRate) + currentTransportFee + currentBonus;

// 修改后
const currentTransportFeePerDay = settings ? settings.transport_fee : transportFee;
// 交通补贴按工作日天数计算（只有工作日有补贴）
const totalTransportFee = currentTransportFeePerDay * attStats.attendanceDays;
const grossSalary = (normalHours * currentHourlyRate) + (overtimeHours * currentOvertimeRate) + totalTransportFee + currentBonus;
```

#### 实时计算更新
```typescript
// 修改前
const grossSalary = (normalHours * hourlyRate) + (overtimeHours * overtimeRate) + transportFee + bonus;

// 修改后
// 交通补贴按工作日天数计算
const totalTransportFee = transportFee * stats.attendanceDays;
const grossSalary = (normalHours * hourlyRate) + (overtimeHours * overtimeRate) + totalTransportFee + bonus;
```

#### UI 显示更新
```typescript
// 修改前
<span className="text-gray-400">交通补贴</span>
<span className="dark:text-gray-300">{transportFee.toLocaleString()} 円</span>

// 修改后
<span className="text-gray-400">交通补贴 ({stats.attendanceDays} 天)</span>
<span className="dark:text-gray-300">{(transportFee * stats.attendanceDays).toLocaleString()} 円</span>
```

#### 设置界面更新
```typescript
// 修改前
<label>交通补贴 (¥)</label>

// 修改后
<label>每日交通补贴 (¥)</label>
<p className="text-[9px] text-gray-400 mt-1">按工作日天数计算，休息日无补贴</p>
```

#### 计算公式说明更新
```typescript
// 新增第5条
5. 交通补贴 = 每日补贴 * 出勤天数
```

### 2. `admin/src/services/dataAggregatorService.ts`

```typescript
// 修改前
const transportFee = salarySettings.transport_fee || 0;

// 修改后
// 交通补贴按工作日天数计算（只有工作日有补贴）
const transportFee = (salarySettings.transport_fee || 0) * attendanceDays;
```

## 影响范围

### 直接影响
1. **工资统计页面** (`SalaryView.tsx`)
   - 显示的交通补贴金额会根据出勤天数动态计算
   - 预估工资会相应调整

2. **月度报告页面** (`MonthlyReportView.tsx`)
   - 通过 `dataAggregatorService` 计算的工资数据会使用新逻辑
   - 工资分析中的交通补贴金额会按天数计算

### 数据库
- **无需修改数据库结构**
- `salary_settings` 表中的 `transport_fee` 字段含义变更：
  - 原含义：每月固定交通补贴金额
  - 新含义：每日交通补贴金额

### 用户体验
- 用户需要重新理解 `transport_fee` 的含义
- 设置界面已添加说明文字："按工作日天数计算，休息日无补贴"
- 显示时会明确标注天数：`交通补贴 (X 天)`

## 示例计算

### 场景 1：正常出勤
- 每日交通补贴：500 円
- 本月出勤天数：20 天
- **交通补贴总额：500 × 20 = 10,000 円**

### 场景 2：部分出勤
- 每日交通补贴：500 円
- 本月出勤天数：15 天（有5天休息）
- **交通补贴总额：500 × 15 = 7,500 円**

### 场景 3：全月休息
- 每日交通补贴：500 円
- 本月出勤天数：0 天
- **交通补贴总额：500 × 0 = 0 円**

## 测试建议

1. **测试不同出勤天数**
   - 验证交通补贴随出勤天数变化
   - 确认休息日不计入补贴

2. **测试设置修改**
   - 修改每日交通补贴金额
   - 验证实时计算是否正确更新

3. **测试月度报告**
   - 验证月度报告中的工资分析使用新逻辑
   - 确认历史数据对比正确

4. **测试边界情况**
   - 出勤天数为 0
   - 交通补贴设置为 0
   - 出勤天数超过月份天数（异常情况）

## 向后兼容性

### 现有数据
- 如果用户之前设置的 `transport_fee` 是月度总额（如 10,000 円）
- 现在会被当作每日金额使用
- **建议用户重新检查和调整交通补贴设置**

### 迁移建议
如果需要保持原有金额不变，用户需要：
1. 计算平均每日补贴：`原月度总额 ÷ 平均出勤天数`
2. 在设置中更新为每日金额

例如：
- 原设置：10,000 円/月
- 平均出勤：20 天/月
- 新设置：500 円/天 (10,000 ÷ 20)

## 验证结果

✅ TypeScript 编译通过
✅ 构建成功
✅ 无运行时错误
✅ UI 显示正确更新
✅ 计算逻辑正确实现

## 相关文件

- `admin/src/views/SalaryView.tsx` - 工资统计视图
- `admin/src/services/dataAggregatorService.ts` - 数据聚合服务
- `admin/src/views/MonthlyReportView.tsx` - 月度报告视图（间接影响）
