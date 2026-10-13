"""
SMV Ladder Planner - Industrial Engineering Production & Learning Curve Planner
Author: Industrial Engineering & Line Balancing Engine
Run locally: streamlit run streamlit_app.py
Deploy: Compatible with Streamlit Community Cloud
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from typing import List, Dict, Any

# Page Configuration
st.set_page_config(
    page_title="SMV Ladder Planner - IE Garment Line Balancing",
    page_icon="🧵",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .metric-card {
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 16px;
        color: #f8fafc;
    }
    .badge-bottleneck {
        background-color: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
        padding: 2px 8px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 11px;
    }
</style>
""", unsafe_allow_html=True)

# Garment Presets
PRESETS = {
    "Men's Pique Polo Shirt": {
        "style_code": "POLO-2026-X",
        "buyer": "Apex Apparel Brand",
        "order_qty": 12000,
        "operators": 28,
        "hours": 8,
        "target_eff": 85,
        "wage_rate": 3.50,
        "curve_type": "7-Day Standard IE Ladder",
        "operations": [
            {"seq": 1, "name": "Fuse Placket & Collar", "section": "prep", "machine": "IRON", "smv": 0.45, "assigned": 1},
            {"seq": 2, "name": "Make Box Placket", "section": "prep", "machine": "SNLS", "smv": 1.10, "assigned": 2},
            {"seq": 3, "name": "Attach Placket to Front", "section": "prep", "machine": "SNLS", "smv": 1.25, "assigned": 2},
            {"seq": 4, "name": "Cut & Turn Placket Box", "section": "prep", "machine": "MANUAL", "smv": 0.40, "assigned": 1},
            {"seq": 5, "name": "Box & Cross Stitch", "section": "prep", "machine": "SNLS", "smv": 0.95, "assigned": 2},
            {"seq": 6, "name": "Knit Collar Edge Hem", "section": "prep", "machine": "SNLS", "smv": 0.50, "assigned": 1},
            {"seq": 7, "name": "Shoulder Join Tape", "section": "assembly", "machine": "4T-OL", "smv": 0.75, "assigned": 1},
            {"seq": 8, "name": "Attach Knit Collar", "section": "assembly", "machine": "4T-OL", "smv": 1.30, "assigned": 2},
            {"seq": 9, "name": "Collar Neck Moon Tape", "section": "assembly", "machine": "SNLS", "smv": 1.15, "assigned": 2},
            {"seq": 10, "name": "Collar Topstitch Edge", "section": "assembly", "machine": "SNLS", "smv": 0.80, "assigned": 1},
            {"seq": 11, "name": "Sleeve Rib Cuff Hem", "section": "assembly", "machine": "4T-OL", "smv": 1.10, "assigned": 2},
            {"seq": 12, "name": "Insert Sleeves Armhole", "section": "assembly", "machine": "4T-OL", "smv": 1.45, "assigned": 2},
            {"seq": 13, "name": "Side Seam Underarm", "section": "assembly", "machine": "4T-OL", "smv": 1.35, "assigned": 2},
            {"seq": 14, "name": "Side Vent Slit Fold", "section": "assembly", "machine": "SNLS", "smv": 1.40, "assigned": 2},
            {"seq": 15, "name": "Bottom Hem Fold", "section": "finishing", "machine": "FL", "smv": 0.90, "assigned": 1},
            {"seq": 16, "name": "Buttonhole (2 Holes)", "section": "finishing", "machine": "BH", "smv": 0.65, "assigned": 1},
            {"seq": 17, "name": "Button Attach (2 Buttons)", "section": "finishing", "machine": "BA", "smv": 0.60, "assigned": 1},
            {"seq": 18, "name": "Trim & QC Inspect", "section": "finishing", "machine": "MANUAL", "smv": 1.25, "assigned": 2},
        ]
    },
    "Crew Neck Cotton T-Shirt": {
        "style_code": "TEE-100-BASIC",
        "buyer": "Nordic Apparel Co.",
        "order_qty": 25000,
        "operators": 18,
        "hours": 8,
        "target_eff": 90,
        "wage_rate": 3.20,
        "curve_type": "5-Day Fast Ramp",
        "operations": [
            {"seq": 1, "name": "Prep Neck Rib Ring", "section": "prep", "machine": "4T-OL", "smv": 0.45, "assigned": 1},
            {"seq": 2, "name": "Shoulder Join Clear Tape", "section": "assembly", "machine": "4T-OL", "smv": 0.65, "assigned": 1},
            {"seq": 3, "name": "Attach Neck Rib Ring", "section": "assembly", "machine": "4T-OL", "smv": 1.15, "assigned": 2},
            {"seq": 4, "name": "Neck Back Tape", "section": "assembly", "machine": "SNLS", "smv": 1.05, "assigned": 2},
            {"seq": 5, "name": "Neck Drop Topstitch", "section": "assembly", "machine": "FL", "smv": 0.75, "assigned": 1},
            {"seq": 6, "name": "Sleeve Hem Fold", "section": "assembly", "machine": "FL", "smv": 1.20, "assigned": 2},
            {"seq": 7, "name": "Attach Sleeves", "section": "assembly", "machine": "4T-OL", "smv": 1.35, "assigned": 2},
            {"seq": 8, "name": "Side Seam Close", "section": "assembly", "machine": "4T-OL", "smv": 1.40, "assigned": 2},
            {"seq": 9, "name": "Bottom Hem Fold", "section": "finishing", "machine": "FL", "smv": 1.20, "assigned": 2},
            {"seq": 10, "name": "Trim Threads & QC", "section": "finishing", "machine": "MANUAL", "smv": 1.10, "assigned": 2},
        ]
    },
    "5-Pocket Denim Jeans": {
        "style_code": "JEAN-DENIM-501",
        "buyer": "West Coast Denim Works",
        "order_qty": 18000,
        "operators": 36,
        "hours": 9,
        "target_eff": 82,
        "wage_rate": 4.00,
        "curve_type": "10-Day Complex Ramp",
        "operations": [
            {"seq": 1, "name": "Hem Coin Pocket", "section": "prep", "machine": "SNLS", "smv": 0.50, "assigned": 1},
            {"seq": 2, "name": "Attach Coin Pocket Facing", "section": "prep", "machine": "SNLS", "smv": 0.85, "assigned": 1},
            {"seq": 3, "name": "Pocket Bag Overlock", "section": "prep", "machine": "5T-OL", "smv": 0.70, "assigned": 1},
            {"seq": 4, "name": "Front Scoop Bind & Topstitch", "section": "prep", "machine": "DNLS", "smv": 1.40, "assigned": 2},
            {"seq": 5, "name": "Attach Fly Zipper", "section": "prep", "machine": "SNLS", "smv": 0.95, "assigned": 1},
            {"seq": 6, "name": "J-Stitch Front Fly", "section": "prep", "machine": "SNLS", "smv": 1.25, "assigned": 2},
            {"seq": 7, "name": "Back Pocket Decorative Arc", "section": "prep", "machine": "DNLS", "smv": 1.65, "assigned": 2},
            {"seq": 8, "name": "Attach Back Pockets (2x)", "section": "prep", "machine": "DNLS", "smv": 2.10, "assigned": 3},
            {"seq": 9, "name": "Join Back Yoke", "section": "assembly", "machine": "FOA", "smv": 1.35, "assigned": 2},
            {"seq": 10, "name": "Join Back Rise", "section": "assembly", "machine": "FOA", "smv": 1.20, "assigned": 2},
            {"seq": 11, "name": "Inseam Flat Felling", "section": "assembly", "machine": "FOA", "smv": 1.80, "assigned": 2},
            {"seq": 12, "name": "Outseam 5-Thread Safety", "section": "assembly", "machine": "5T-OL", "smv": 1.60, "assigned": 2},
            {"seq": 13, "name": "Attach Waistband", "section": "assembly", "machine": "KANSAI", "smv": 2.00, "assigned": 3},
            {"seq": 14, "name": "Attach 5 Loops Bartack", "section": "finishing", "machine": "BT", "smv": 1.70, "assigned": 2},
            {"seq": 15, "name": "Bottom Leg Rope Hem", "section": "finishing", "machine": "SNLS", "smv": 1.30, "assigned": 2},
            {"seq": 16, "name": "Tack Button & Rivets", "section": "finishing", "machine": "BA", "smv": 1.25, "assigned": 2},
            {"seq": 17, "name": "Quality Audit", "section": "finishing", "machine": "MANUAL", "smv": 1.60, "assigned": 2},
        ]
    }
}

LADDER_CURVES = {
    "5-Day Fast Ramp": [45, 65, 78, 86, 92],
    "7-Day Standard IE Ladder": [32, 48, 62, 72, 80, 86, 90],
    "10-Day Complex Ramp": [25, 36, 48, 58, 67, 75, 82, 86, 90, 92],
    "14-Day Outerwear Ramp": [20, 28, 38, 48, 56, 64, 71, 77, 82, 86, 89, 91, 93, 95]
}

# Sidebar Configurations
st.sidebar.title("🧵 SMV Ladder Settings")
selected_preset_name = st.sidebar.selectbox("Garment Style Preset", list(PRESETS.keys()))
preset_data = PRESETS[selected_preset_name]

# Style Details
style_code = st.sidebar.text_input("Style Code", preset_data["style_code"])
buyer_name = st.sidebar.text_input("Buyer / Brand", preset_data["buyer"])
order_qty = st.sidebar.number_input("Order Quantity (pcs)", min_value=100, max_value=500000, value=preset_data["order_qty"], step=500)

# Line Parameters
st.sidebar.subheader("Line Parameters")
total_operators = st.sidebar.number_input("Total Operators in Line", min_value=5, max_value=150, value=preset_data["operators"], step=1)
working_hours = st.sidebar.number_input("Working Hours / Shift", min_value=6, max_value=12, value=preset_data["hours"], step=1)
target_eff_pct = st.sidebar.slider("Steady Target Efficiency (%)", min_value=40, max_value=100, value=preset_data["target_eff"], step=1)
hourly_wage = st.sidebar.number_input("Operator Hourly Wage ($)", min_value=0.5, max_value=50.0, value=preset_data["wage_rate"], step=0.25)

# Ramp-Up Curve Choice
selected_curve_name = st.sidebar.selectbox("Ramp-Up Ladder Preset", list(LADDER_CURVES.keys()), index=1)
base_curve = LADDER_CURVES[selected_curve_name]

# Initialize or Load Operations into Session State
if "operations" not in st.session_state or st.sidebar.button("Reset Operations to Preset"):
    st.session_state.operations = [dict(op) for op in preset_data["operations"]]

# Calculations Engine
operations = st.session_state.operations
total_smv = sum(float(op["smv"]) for op in operations)
pitch_time = total_smv / max(1, total_operators)

# Target outputs
target_pcs_hr = int((total_operators * 60 * (target_eff_pct / 100)) / max(0.01, total_smv))
target_pcs_day = target_pcs_hr * working_hours
cycle_time_sec = int(3600 / max(1, target_pcs_hr))

# Balance Efficiency
station_smvs = [op["smv"] / max(1, op["assigned"]) for op in operations]
max_station_smv = max(station_smvs) if station_smvs else 0.01
line_balance_eff = min(100.0, (total_smv / (max_station_smv * max(1, total_operators))) * 100.0)

# Labor cost per piece
daily_labor_cost = total_operators * hourly_wage * working_hours
labor_cost_per_pc = daily_labor_cost / max(1, target_pcs_day)

# Identify Bottlenecks
bottlenecks = []
for op in operations:
    station_cycle = op["smv"] / max(1, op["assigned"])
    if station_cycle > pitch_time * 1.15:
        bottlenecks.append(op["name"])

# Top Header KPI Cards
st.title("SMV Ladder Planner 🧵")
st.caption(f"**{selected_preset_name}** ({style_code}) | Buyer: {buyer_name} | Order: {order_qty:,} pcs")

kpi1, kpi2, kpi3, kpi4, kpi5 = st.columns(5)
with kpi1:
    st.metric("Total Garment SMV", f"{total_smv:.2f} min", "Standard Allowed Min")
with kpi2:
    st.metric("Pitch Time", f"{pitch_time:.2f} min", f"{total_operators} Operators")
with kpi3:
    st.metric("Line Balance Eff.", f"{line_balance_eff:.1f}%", f"{len(bottlenecks)} Bottlenecks", delta_color="normal" if line_balance_eff >= 80 else "inverse")
with kpi4:
    st.metric("Steady Daily Target", f"{target_pcs_day:,} pcs", f"{target_pcs_hr} pcs/hr")
with kpi5:
    st.metric("Labor Cost / Garment", f"${labor_cost_per_pc:.2f}", f"${daily_labor_cost:,.0f} / shift")

st.divider()

# Navigation Tabs
tab_ladder, tab_ops, tab_balance, tab_report = st.tabs([
    "📈 Ramp-Up Ladder Plan",
    "✂️ Operations Bulletin",
    "⚖️ Line Balancing & Pitch Chart",
    "📋 IE Report & Export"
])

# -------------------------------------------------------------
# TAB 1: RAMP-UP LADDER PLAN
# -------------------------------------------------------------
with tab_ladder:
    st.subheader(f"Learning Curve Ramp-Up Schedule ({selected_curve_name})")
    st.write("Day-by-day learning curve progression factoring industrial ramp-up targets, cumulative output, and shortfall.")

    # Calculate day-by-day ladder plan
    ladder_rows = []
    running_cum = 0
    shift_weights = [0.88, 1.05, 1.08, 0.96, 0.92, 1.06, 1.04, 0.91]

    for idx, eff in enumerate(base_curve):
        day_num = idx + 1
        day_target = int((working_hours * 60 * total_operators * (eff / 100)) / max(0.01, total_smv))
        running_cum += day_target
        rem_order = max(0, order_qty - running_cum)
        avg_hr = int(day_target / working_hours)
        
        ladder_rows.append({
            "Day": f"Day {day_num}",
            "Efficiency (%)": eff,
            "Daily Target (pcs)": day_target,
            "Avg Hourly (pcs)": avg_hr,
            "Cumulative Output": running_cum,
            "Order Balance Remaining": rem_order,
            "Progress (%)": f"{min(100, int((running_cum / order_qty) * 100))}%"
        })

    df_ladder = pd.DataFrame(ladder_rows)

    col_ladder_table, col_ladder_chart = st.columns([1, 1])

    with col_ladder_table:
        st.dataframe(df_ladder, hide_index=True, use_container_width=True)

    with col_ladder_chart:
        # Plotly Cumulative Production Curve
        fig_curve = go.Figure()
        fig_curve.add_trace(go.Bar(
            x=[r["Day"] for r in ladder_rows],
            y=[r["Daily Target (pcs)"] for r in ladder_rows],
            name="Daily Target (pcs)",
            marker_color="#3b82f6"
        ))
        fig_curve.add_trace(go.Scatter(
            x=[r["Day"] for r in ladder_rows],
            y=[r["Cumulative Output"] for r in ladder_rows],
            name="Cumulative Output",
            yaxis="y2",
            mode="lines+markers",
            line=dict(color="#10b981", width=3)
        ))
        fig_curve.update_layout(
            title="Daily Target & Cumulative Ramp-Up",
            yaxis=dict(title="Daily Output (pcs)"),
            yaxis2=dict(title="Cumulative Output (pcs)", overlaying="y", side="right"),
            legend=dict(x=0.01, y=0.99),
            margin=dict(l=20, r=20, t=40, b=20),
            template="plotly_dark"
        )
        st.plotly_chart(fig_curve, use_container_width=True)

    # Hourly distribution for Day 1 vs Steady State
    st.subheader("Shift Hourly Output Profile")
    st.caption("Standard IE human shift performance distribution (bundle warmup, peak rhythm, post-lunch fatigue)")

    selected_day_inspect = st.selectbox("Inspect Hourly Targets For:", [r["Day"] for r in ladder_rows], index=0)
    target_for_day = next(r["Daily Target (pcs)"] for r in ladder_rows if r["Day"] == selected_day_inspect)
    hourly_avg = target_for_day / working_hours

    hourly_targets = []
    for h in range(working_hours):
        w = shift_weights[h % len(shift_weights)]
        hourly_targets.append(int(hourly_avg * w))

    df_hourly = pd.DataFrame({
        "Hour": [f"Hour {h+1}" for h in range(working_hours)],
        "Target Output (pcs)": hourly_targets
    })

    fig_hourly = px.bar(df_hourly, x="Hour", y="Target Output (pcs)", text="Target Output (pcs)", template="plotly_dark", color_discrete_sequence=["#6366f1"])
    fig_hourly.update_traces(textposition="outside")
    fig_hourly.update_layout(margin=dict(l=20, r=20, t=20, b=20))
    st.plotly_chart(fig_hourly, use_container_width=True)

# -------------------------------------------------------------
# TAB 2: OPERATIONS BULLETIN
# -------------------------------------------------------------
with tab_ops:
    st.subheader("Industrial Engineering Operation Bulletin")
    st.write("Review and update operation sequence, machinery codes, SMVs, and assigned operators.")

    # Form to add new operation
    with st.expander("➕ Add New Sewing Operation"):
        with st.form("add_op_form"):
            col_a, col_b = st.columns(2)
            with col_a:
                add_name = st.text_input("Operation Name", "Collar Edge Topstitch")
                add_sec = st.selectbox("Section", ["prep", "assembly", "finishing"])
            with col_b:
                add_mach = st.selectbox("Machine Type", ["SNLS", "DNLS", "4T-OL", "5T-OL", "FL", "KANSAI", "FOA", "BH", "BA", "BT", "IRON", "MANUAL"])
                add_smv = st.number_input("Target SMV (minutes)", min_value=0.05, max_value=10.0, value=0.85, step=0.05)
                add_assigned = st.number_input("Assigned Operators", min_value=1, max_value=10, value=1, step=1)
            
            if st.form_submit_button("Insert Operation"):
                new_op = {
                    "seq": len(st.session_state.operations) + 1,
                    "name": add_name,
                    "section": add_sec,
                    "machine": add_mach,
                    "smv": add_smv,
                    "assigned": add_assigned
                }
                st.session_state.operations.append(new_op)
                st.success(f"Added {add_name}!")
                st.rerun()

    # Operations table with in-place editable fields (Direct editing without formula lock)
    st.info("💡 **Spreadsheet Mode Active**: Edit Name, Section, Machine, SMV, Assigned Ops directly in the table below or add new rows at the bottom.")
    
    df_raw = pd.DataFrame(st.session_state.operations)
    if not df_raw.empty:
        edited_df = st.data_editor(
            df_raw,
            num_rows="dynamic",
            use_container_width=True,
            hide_index=True,
            column_config={
                "seq": st.column_config.NumberColumn("Seq", min_value=1, step=1, format="%d"),
                "name": st.column_config.TextColumn("Operation Name", required=True),
                "section": st.column_config.SelectboxColumn("Section", options=["prep", "assembly", "finishing"], required=True),
                "machine": st.column_config.SelectboxColumn("Machine", options=["SNLS", "DNLS", "4T-OL", "5T-OL", "FL", "KANSAI", "FOA", "BH", "BA", "BT", "IRON", "MANUAL"], required=True),
                "smv": st.column_config.NumberColumn("SMV (min)", min_value=0.01, step=0.05, format="%.2f"),
                "assigned": st.column_config.NumberColumn("Assigned Ops", min_value=1, step=1, format="%d"),
            },
            key="ops_editor"
        )
        # Synchronize edits back to session state
        if not edited_df.equals(df_raw):
            st.session_state.operations = edited_df.to_dict('records')
            st.rerun()

# -------------------------------------------------------------
# TAB 3: LINE BALANCING & PITCH DIAGRAM
# -------------------------------------------------------------
with tab_balance:
    st.subheader("Workstation Pitch Diagram")
    st.write("Visualizes cycle times per workstation against line pitch benchmark. Red horizontal line represents pitch target.")

    # Auto-Balance Button
    if st.button("✨ Run Algorithmic Auto-Balance Optimizer"):
        # Auto balance logic
        target_ops_count = total_operators
        updated_ops = [dict(op) for op in st.session_state.operations]
        
        # Proportional allocation
        for op in updated_ops:
            theoretical = (op["smv"] * target_ops_count) / max(0.01, total_smv)
            op["assigned"] = max(1, round(theoretical))
        
        # Adjust total sum
        current_sum = sum(op["assigned"] for op in updated_ops)
        while current_sum < target_ops_count:
            highest_cycle_op = max(updated_ops, key=lambda x: x["smv"] / x["assigned"])
            highest_cycle_op["assigned"] += 1
            current_sum += 1
            
        while current_sum > target_ops_count:
            eligible = [op for op in updated_ops if op["assigned"] > 1]
            if eligible:
                lowest_cycle_op = min(eligible, key=lambda x: x["smv"] / x["assigned"])
                lowest_cycle_op["assigned"] -= 1
                current_sum -= 1
            else:
                break
                
        st.session_state.operations = updated_ops
        st.success("Line operator assignment optimized!")
        st.rerun()

    # Create Pitch Bar Chart
    op_labels = [f"{op['seq']}. {op['name']}" for op in st.session_state.operations]
    station_cycles = [op["smv"] / max(1, op["assigned"]) for op in st.session_state.operations]
    colors = ["#f59e0b" if c > pitch_time * 1.15 else "#3b82f6" for c in station_cycles]

    fig_pitch = go.Figure()
    fig_pitch.add_trace(go.Bar(
        x=op_labels,
        y=station_cycles,
        marker_color=colors,
        name="Station Cycle Time (min)"
    ))
    fig_pitch.add_hline(
        y=pitch_time,
        line_dash="dash",
        line_color="#f43f5e",
        line_width=2.5,
        annotation_text=f"Pitch Target ({pitch_time:.2f}m)",
        annotation_position="top right"
    )
    fig_pitch.update_layout(
        title="Workstation Cycle Times vs Pitch Benchmark",
        xaxis=dict(tickangle=-45),
        yaxis=dict(title="Minutes / Piece"),
        template="plotly_dark",
        margin=dict(l=20, r=20, t=40, b=120)
    )
    st.plotly_chart(fig_pitch, use_container_width=True)

    # Bottleneck Interventions
    if bottlenecks:
        st.warning(f"**{len(bottlenecks)} Bottlenecks Detected:** " + ", ".join(bottlenecks))
        st.info("💡 **Recommended Action:** Click 'Run Algorithmic Auto-Balance Optimizer' above or assign helpers to these stations.")
    else:
        st.success("🎉 Line is smoothly balanced with no bottleneck operations exceeding pitch time threshold!")

# -------------------------------------------------------------
# TAB 4: IE REPORT & EXPORT
# -------------------------------------------------------------
with tab_report:
    st.subheader("Industrial Engineering Line Bulletin Report")

    # Machinery Summary
    mach_counts = {}
    for op in st.session_state.operations:
        m = op["machine"]
        mach_counts[m] = mach_counts.get(m, 0) + op["assigned"]

    col_rep_a, col_rep_b = st.columns(2)
    with col_rep_a:
        st.write("#### Machine Allocation Summary")
        df_mach = pd.DataFrame(list(mach_counts.items()), columns=["Machine Type", "Units Required"])
        st.dataframe(df_mach, hide_index=True, use_container_width=True)

    with col_rep_b:
        st.write("#### Production Planning Metrics")
        st.markdown(f"""
        - **Total Garment SMV:** {total_smv:.2f} minutes
        - **Pitch Benchmark:** {pitch_time:.2f} minutes / station
        - **Line Balancing Efficiency:** {line_balance_eff:.1f}%
        - **Steady State Daily Output:** {target_pcs_day:,} pieces/day
        - **Estimated Days to Complete Order:** {order_qty / max(1, target_pcs_day):.1f} working days
        - **Direct Labor Cost / Piece:** ${labor_cost_per_pc:.2f}
        """)

    st.divider()
    st.subheader("Data Export Downloads")
    csv_ladder = df_ladder.to_csv(index=False).encode('utf-8')
    csv_ops = df_ops_table.to_csv(index=False).encode('utf-8')

    dcol1, dcol2 = st.columns(2)
    with dcol1:
        st.download_button(
            label="📥 Download Ladder Plan CSV",
            data=csv_ladder,
            file_name=f"Ladder_Plan_{style_code}.csv",
            mime="text/csv",
            use_container_width=True
        )
    with dcol2:
        st.download_button(
            label="📥 Download Operation Bulletin CSV",
            data=csv_ops,
            file_name=f"Operation_Bulletin_{style_code}.csv",
            mime="text/csv",
            use_container_width=True
        )
