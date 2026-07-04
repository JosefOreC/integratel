from sqlalchemy import Column, String, Integer, Float
from app.database import Base


class Cliente(Base):
    __tablename__ = "dim_cliente"

    id_cliente       = Column(String, primary_key=True)
    nombre           = Column(String)
    segmento         = Column(String)
    departamento     = Column(String)
    antiguedad_meses = Column(Integer)
    estado_actual    = Column(String)
