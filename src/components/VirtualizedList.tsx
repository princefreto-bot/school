import React from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps {
  items: any[];
  itemHeight: number;
  listHeight: number;
  renderItem: (props: { index: number; style: React.CSSProperties; data: any }) => React.ReactElement;
  width?: string | number;
}

export const VirtualizedList: React.FC<VirtualizedListProps> = ({
  items,
  itemHeight,
  listHeight,
  renderItem,
  width = '100%',
}) => {
  if (!items || items.length === 0) {
    return <div className="p-4 text-center text-slate-500">Aucun élément à afficher</div>;
  }

  return (
    <List
      height={listHeight}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      itemData={items}
      className="scrollbar-thin scrollbar-thumb-slate-200"
    >
      {({ index, style, data }) => renderItem({ index, style, data: data[index] })}
    </List>
  );
};
