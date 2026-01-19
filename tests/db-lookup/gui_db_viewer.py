import sys
import os
from pathlib import Path
import tkinter as tk
from tkinter import ttk, messagebox
from sqlalchemy import delete, and_, inspect, MetaData, Table
from sqlmodel import SQLModel, create_engine, Session, select

# Add project root to sys.path
project_root = Path(__file__).resolve().parents[2]
sys.path.append(str(project_root))

# Import models
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.subscription import Subscription, SubscriptionLeave
from app.models.route import Route, RouteStop
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.seat_allocation import SeatAllocation
from app.models.payment import Payment
from app.models.notification import Notification
from app.models.profile import StaffProfile, DriverProfile
from app.models.token import Token

# Map table names to model classes
TABLE_MAP = {
    "User": User,
    "Role": Role,
    "UserRole": UserRole,
    "Subscription": Subscription,
    "SubscriptionLeave": SubscriptionLeave,
    "Route": Route,
    "RouteStop": RouteStop,
    "Vehicle": Vehicle,
    "Trip": Trip,
    "SeatAllocation": SeatAllocation,
    "Payment": Payment,
    "Notification": Notification,
    "StaffProfile": StaffProfile,
    "DriverProfile": DriverProfile,
    "Token": Token
}

# Database connection
DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/transport"
engine = create_engine(DATABASE_URL)

class DBViewerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Nexus-Ride DB Viewer")
        self.root.geometry("1200x700")

        # State for sorting and data
        self.current_data = []
        self.current_rows = []
        self.current_columns = []
        self.sort_column = None
        self.sort_reverse = False
        self.row_data_map = {}
        self.metadata = MetaData()
        self.inspector = inspect(engine)
        self.reflected_tables = {}

        # Main layout
        self.paned_window = ttk.PanedWindow(root, orient=tk.HORIZONTAL)
        self.paned_window.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # === Left Panel (Table List) ===
        self.left_frame = ttk.Frame(self.paned_window, width=200)
        self.paned_window.add(self.left_frame, weight=1)

        self.lbl_tables = ttk.Label(self.left_frame, text="Select Table", font=("Arial", 10, "bold"))
        self.lbl_tables.pack(pady=5)

        self.table_listbox = tk.Listbox(self.left_frame, selectmode=tk.SINGLE, font=("Arial", 10))
        self.table_listbox.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.table_listbox.bind("<<ListboxSelect>>", self.on_table_select)

        for table_name in sorted(TABLE_MAP.keys()):
            self.table_listbox.insert(tk.END, table_name)

        # === Right Panel (Data View + Controls) ===
        self.right_frame = ttk.Frame(self.paned_window)
        self.paned_window.add(self.right_frame, weight=4)

        # Top Control Bar
        self.control_frame = ttk.Frame(self.right_frame)
        self.control_frame.pack(fill=tk.X, padx=5, pady=5)

        self.lbl_data = ttk.Label(self.control_frame, text="Select a table to view data", font=("Arial", 11, "bold"))
        self.lbl_data.pack(side=tk.LEFT, pady=5)

        self.btn_refresh = ttk.Button(self.control_frame, text="↻ Refresh", command=self.refresh_current_table)
        self.btn_refresh.pack(side=tk.RIGHT, padx=5)

        self.btn_delete = ttk.Button(self.control_frame, text="Delete Selected", command=self.delete_selected_rows)
        self.btn_delete.pack(side=tk.RIGHT, padx=5)

        # Search Bar
        self.search_var = tk.StringVar()
        self.search_var.trace("w", self.filter_data)
        self.entry_search = ttk.Entry(self.control_frame, textvariable=self.search_var, width=30)
        self.entry_search.pack(side=tk.RIGHT, padx=5)
        ttk.Label(self.control_frame, text="Search:").pack(side=tk.RIGHT)

        # Treeview for data
        self.tree_frame = ttk.Frame(self.right_frame)
        self.tree_frame.pack(fill=tk.BOTH, expand=True, padx=5)

        self.tree_scroll_y = ttk.Scrollbar(self.tree_frame, orient=tk.VERTICAL)
        self.tree_scroll_x = ttk.Scrollbar(self.tree_frame, orient=tk.HORIZONTAL)
        
        self.tree = ttk.Treeview(self.tree_frame, show="headings", 
                                 yscrollcommand=self.tree_scroll_y.set, 
                                 xscrollcommand=self.tree_scroll_x.set)
        
        self.tree_scroll_y.config(command=self.tree.yview)
        self.tree_scroll_x.config(command=self.tree.xview)

        self.tree_scroll_y.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree_scroll_x.pack(side=tk.BOTTOM, fill=tk.X)
        self.tree.pack(fill=tk.BOTH, expand=True)

        # Status Bar
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        self.status_bar = ttk.Label(self.right_frame, textvariable=self.status_var, relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(fill=tk.X, padx=5, pady=2)

    def on_table_select(self, event):
        selection = self.table_listbox.curselection()
        if not selection:
            return
        
        table_name = self.table_listbox.get(selection[0])
        self.load_table_data(table_name)

    def refresh_current_table(self):
        selection = self.table_listbox.curselection()
        if selection:
            table_name = self.table_listbox.get(selection[0])
            self.load_table_data(table_name)
        else:
            messagebox.showinfo("Info", "Please select a table first.")

    def delete_selected_rows(self):
        selection = self.tree.selection()
        if not selection:
            messagebox.showinfo("Info", "Please select one or more rows to delete.")
            return

        table_selection = self.table_listbox.curselection()
        if not table_selection:
            messagebox.showinfo("Info", "Please select a table first.")
            return

        table_name = self.table_listbox.get(table_selection[0])
        model = TABLE_MAP.get(table_name)
        if not model:
            return

        table = model.__table__
        if not table.primary_key.columns:
            messagebox.showerror("Error", "Cannot delete rows without a primary key.")
            return

        confirm = messagebox.askyesno(
            "Confirm Delete",
            f"Delete {len(selection)} row(s) from {table_name}? This will also delete related rows."
        )
        if not confirm:
            return

        try:
            visited = set()
            with Session(engine) as session:
                for item_id in selection:
                    row_data = self.row_data_map.get(item_id)
                    if not row_data:
                        continue
                    self.delete_with_cascade(session, table, row_data, visited)
                session.commit()

            self.load_table_data(table_name)
            self.status_var.set(f"Deleted {len(selection)} row(s) from {table_name}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to delete rows:\n{str(e)}")

    def load_table_data(self, table_name):
        self.status_var.set(f"Loading {table_name}...")
        self.root.update_idletasks()

        # Clear existing tree
        self.tree.delete(*self.tree.get_children())
        self.tree["columns"] = []
        self.search_var.set("")
        self.sort_column = None
        self.sort_reverse = False
        
        model = TABLE_MAP.get(table_name)
        if not model:
            return

        self.lbl_data.config(text=f"Table: {table_name}")

        try:
            # Setup columns
            columns = list(model.__fields__.keys())
            self.current_columns = columns
            self.setup_columns(columns)

            with Session(engine) as session:
                statement = select(model)
                results = session.exec(statement).all()

                self.current_data = []
                self.current_rows = []
                if results:
                    for row in results:
                        row_data = row.model_dump()
                        # Convert all to string for display/search
                        values = [str(row_data.get(col, "")) for col in columns]
                        self.current_data.append(values)
                        self.current_rows.append(row_data)

                self.populate_tree(self.current_data, self.current_rows)
                self.status_var.set(f"Loaded {len(self.current_data)} records from {table_name}")

        except Exception as e:
            self.status_var.set("Error loading data")
            messagebox.showerror("Error", f"Failed to load table {table_name}:\n{str(e)}")

    def setup_columns(self, columns):
        self.tree["columns"] = columns
        for col in columns:
            self.tree.heading(col, text=col, command=lambda c=col: self.sort_by_column(c))
            # Adjust column width based on name length
            width = max(100, min(300, len(col) * 12))
            self.tree.column(col, width=width, anchor=tk.W)

    def populate_tree(self, data, row_dicts):
        self.tree.delete(*self.tree.get_children())
        self.row_data_map = {}
        for values, row_data in zip(data, row_dicts):
            item_id = self.tree.insert("", tk.END, values=values)
            self.row_data_map[item_id] = row_data

    def filter_data(self, *args):
        query = self.search_var.get().lower()
        if not query:
            self.populate_tree(self.current_data, self.current_rows)
            self.status_var.set(f"Showing all {len(self.current_data)} records")
            return

        filtered_data = []
        filtered_rows = []
        for row, row_data in zip(self.current_data, self.current_rows):
            # Check if query matches any column in the row
            if any(query in str(cell).lower() for cell in row):
                filtered_data.append(row)
                filtered_rows.append(row_data)
        
        self.populate_tree(filtered_data, filtered_rows)
        self.status_var.set(f"Found {len(filtered_data)} matching records")

    def sort_by_column(self, col):
        if not self.current_data:
            return

        try:
            col_index = self.current_columns.index(col)
        except ValueError:
            return

        # Toggle sort direction if clicking same column
        if self.sort_column == col:
            self.sort_reverse = not self.sort_reverse
        else:
            self.sort_column = col
            self.sort_reverse = False

        # Sort current data (which might be filtered, but let's sort the master list and re-filter if needed)
        # For simplicity, we sort the master list and re-apply filter
        
        # Helper to try sorting as numbers if possible, else strings
        def sort_key(row_data):
            val = row_data.get(col)
            try:
                return float(val)
            except (TypeError, ValueError):
                return str(val).lower()

        combined = list(zip(self.current_data, self.current_rows))
        combined.sort(key=lambda pair: sort_key(pair[1]), reverse=self.sort_reverse)
        if combined:
            self.current_data, self.current_rows = map(list, zip(*combined))
        else:
            self.current_data, self.current_rows = [], []
        
        # Update header arrow (visual cue)
        for c in self.current_columns:
            text = c
            if c == col:
                text += " ↓" if self.sort_reverse else " ↑"
            self.tree.heading(c, text=text)

        # Re-apply filter to show sorted results
        self.filter_data()

    def get_referencing_tables(self, table):
        references = []
        for table_name in self.inspector.get_table_names():
            for fk in self.inspector.get_foreign_keys(table_name):
                if fk.get("referred_table") != table.name:
                    continue
                child_table = self.get_reflected_table(table_name)
                for local_col, remote_col in zip(fk.get("constrained_columns", []), fk.get("referred_columns", [])):
                    if local_col in child_table.c and remote_col in table.c:
                        references.append((child_table, child_table.c[local_col], table.c[remote_col]))
        return references

    def get_reflected_table(self, table_name):
        if table_name not in self.reflected_tables:
            self.reflected_tables[table_name] = Table(table_name, self.metadata, autoload_with=engine)
        return self.reflected_tables[table_name]

    def delete_with_cascade(self, session, table, row_data, visited):
        pk_values = tuple((col.name, row_data.get(col.name)) for col in table.primary_key.columns)
        key = (table.name, pk_values)
        if key in visited:
            return
        visited.add(key)

        for child_table, child_col, parent_col in self.get_referencing_tables(table):
            parent_value = row_data.get(parent_col.name)
            if parent_value is None:
                continue

            child_rows = session.exec(select(child_table).where(child_col == parent_value)).all()
            for child_row in child_rows:
                row_mapping = child_row._mapping
                child_row_data = {col.name: row_mapping[col] for col in child_table.columns}
                self.delete_with_cascade(session, child_table, child_row_data, visited)

        filters = [table.c[col.name] == row_data.get(col.name) for col in table.primary_key.columns]
        if not filters:
            return
        where_clause = filters[0] if len(filters) == 1 else and_(*filters)
        session.exec(delete(table).where(where_clause))

def main():
    try:
        root = tk.Tk()
        app = DBViewerApp(root)
        root.mainloop()
    except Exception as e:
        print(f"Failed to start GUI: {e}")
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()
